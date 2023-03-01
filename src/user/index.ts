import _ = require('lodash');

import groups = require('../groups');
import plugins = require('../plugins');
import db = require('../database');
import privileges = require('../privileges');
import categories = require('../categories');
import meta = require('../meta');
import utils = require('../utils');

require('./data');
require('./auth');
require('./bans');
require('./create');
require('./posts');
require('./topics');
require('./categories');
require('./follow');
require('./profile');
require('./admin');
require('./delete');
require('./settings');
require('./search');
require('./jobs');
require('./picture');
require('./approval');
require('./invite');
require('./password');
require('./info');
require('./online');
require('./blocks');
require('./uploads');

const User = {
    /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-var-requires */
    email: require('./email'),
    notifications: require('./notifications'),
    reset: require('./reset'),
    digest: require('./digest'),
    interstitials: require('./interstitials'),
    /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-var-requires */

    exists: async function (uids: number[]): Promise<boolean> {
        return await (
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            Array.isArray(uids) ?
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                db.isSortedSetMembers('users:joindate', uids) :
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                db.isSortedSetMember('users:joindate', uids)
        );
    },

    existsBySlug: async function (userslug: string): Promise<boolean> {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
        const exists: number = await User.getUidByUserslug(userslug);
        return !!exists;
    },

    getUidsFromSet: async function (set: string, start: string, stop: string) {
        if (set === 'users:online') {
            const count: number = parseInt(stop, 10) === -1 ? parseInt(stop, 10) :
                parseInt(stop, 10) - parseInt(start, 10) + 1;
            const now: number = Date.now();
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            return await db.getSortedSetRevRangeByScore(set, start, count, '+inf', now - (meta.config.onlineCutoff * 60000));
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        return await db.getSortedSetRevRange(set, start, stop);
    },

    getUsersFromSet: async function (set: string, uid: string, start: string, stop: string) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        const uids: string[] = await User.getUidsFromSet(set, start, stop);
        return await User.getUsers(uids, uid);
    },

    getUsersWithFields: async function (uids: string[], fields, uid: string) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        let results = await plugins.hooks.fire('filter:users.addFields', { fields: fields });
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        results.fields = _.uniq(results.fields);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        const userData: [] = await module.exports.getUsersFields(uids, results.fields);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        results = await plugins.hooks.fire('filter:userlist.get', { users: userData, uid: uid });
        return results.users;
    },

    getUsers: async function (uids: string[], uid: string) {
        const userData = await User.getUsersWithFields(uids, [
            'uid', 'username', 'userslug', 'accounttype', 'picture', 'status',
            'postcount', 'reputation', 'email:confirmed', 'lastonline',
            'flags', 'banned', 'banned:expire', 'joindate',
        ], uid);

        return module.exports.hidePrivateData(userData, uid);
    },

    getStatus: function (userData: { uid: number; lastonline: number; status: any; }): string {
        if (userData.uid <= 0) {
            return 'offline';
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        const isOnline: boolean = (Date.now() - userData.lastonline) < (meta.config.onlineCutoff * 60000);
        return isOnline ? (userData.status || 'online') : 'offline';
    },

    getUidByUsername: async function getUidByUsername(username: string): Promise<number> {
        if (!username) {
            return 0;
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        return await db.sortedSetScore('username:uid', username);
    },

    getUidsByUsernames: async function getUidsByUsernames (usernames: string[]): Promise<string[]> {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        return await db.sortedSetScores('username:uid', usernames);
    },

    getUidByUserslug: async function (userslug: string): Promise<number> {
        if (!userslug) {
            return 0;
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        return await db.sortedSetScore('userslug:uid', userslug);
    },

    getUsernamesByUids: async function (uids: string[]): Promise<string[]> {
        const users = await module.exports.getUsersFields(uids, ['username']);
        return users.map((user: { username: string; }) => user.username);
    },

    getUsernameByUserslug: async function (slug: string): Promise<string> {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        const uid: number = await User.getUidByUserslug(slug);
        return await module.exports.getUserField(uid, 'username');
    },

    getUidByEmail: async function (email: string): Promise<number> {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        return await db.sortedSetScore('email:uid', email.toLowerCase());
    },

    getUidsByEmails: async function (emails: string[]): Promise<number[]> {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        emails = emails.map(email => email && email.toLowerCase());
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        return await db.sortedSetScores('email:uid', emails);
    },

    getUsernameByEmail: async function (email: string): Promise<string> {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        const uid: string = await db.sortedSetScore('email:uid', String(email).toLowerCase());
        return await module.exports.getUserField(uid, 'username');
    },

    isModerator: async function (uid: string, cid: string): Promise<boolean> {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        return await privileges.users.isModerator(uid, cid);
    },

    isModeratorOfAnyCategory: async function (uid: string): Promise<boolean> {
        const cids = await module.exports.getModeratedCids(uid);
        return Array.isArray(cids) ? !!cids.length : false;
    },

    isAdministrator: async function (uid: string): Promise<boolean> {
        if (await privileges.users.isAdministrator(uid)) {
            return true;
        }
        const accounttype = await module.exports.getUserField(uid, 'accounttype');
        if (accounttype === 'instructor') {
            console.log(accounttype);
            return true;
        }
        // return false if user is not instructor or admin
        return false;
    },

    isGlobalModerator: async function (uid: string): Promise<boolean>  {
        return await privileges.users.isGlobalModerator(uid);
    },

    getPrivileges: async function (uid: string):
         Promise<{isAdmin: boolean, isGlobalModerator: boolean, isModeratorOfAnyCategory: boolean}> {
        return await utils.promiseParallel({
            isAdmin: User.isAdministrator(uid),
            isGlobalModerator: User.isGlobalModerator(uid),
            isModeratorOfAnyCategory: User.isModeratorOfAnyCategory(uid),
        });
    },

    isPrivileged: async function (uid: string): Promise<boolean> {
        if (!(parseInt(uid, 10) > 0)) {
            return false;
        }
        const results: {isAdmin: boolean, isGlobalModerator: boolean, isModeratorOfAnyCategory: boolean} =
            await User.getPrivileges(uid);
        return results ? (results.isAdmin || results.isGlobalModerator || results.isModeratorOfAnyCategory) : false;
    },

    isAdminOrGlobalMod: async function (uid: string): Promise<boolean> {
        const [isAdmin, isGlobalMod]: boolean[] = await Promise.all([
            User.isAdministrator(uid),
            User.isGlobalModerator(uid),
        ]);
        return isAdmin || isGlobalMod;
    },

    isAdminOrSelf: async function (callerUid: string, uid: string): Promise<void> {
        await User.isSelfOrMethod(callerUid, uid, User.isAdministrator);
    },

    isAdminOrGlobalModOrSelf: async function (callerUid: string, uid: string): Promise<void> {
        await User.isSelfOrMethod(callerUid, uid, User.isAdminOrGlobalMod);
    },

    isPrivilegedOrSelf: async function (callerUid: string, uid: string): Promise<void> {
        await User.isSelfOrMethod(callerUid, uid, User.isPrivileged);
    },

    isSelfOrMethod: async function (callerUid: string, uid: string, method: (arg0: string) => Promise<boolean>): Promise<void> {
        if (parseInt(callerUid, 10) === parseInt(uid, 10)) {
            return;
        }
        const isPass: boolean = await method(callerUid);
        if (!isPass) {
            throw new Error('[[error:no-privileges]]');
        }
    },

    getAdminsandGlobalMods: async function (): Promise<string[]> {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        const results: string[] = await groups.getMembersOfGroups(['administrators', 'Global Moderators']);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        return await module.exports.getUsersData(_.union(...results));
    },

    getAdminsandGlobalModsandModerators: async function (): Promise<string[]> {
        const results: [any, any, string[]] = await Promise.all([
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            groups.getMembers('administrators', 0, -1),
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            groups.getMembers('Global Moderators', 0, -1),
            User.getModeratorUids(),
        ]);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        return await module.exports.getUsersData(_.union(...results));
    },

    getFirstAdminUid: async function (): Promise<string> {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        return (await db.getSortedSetRange('group:administrators:members', 0, 0))[0];
    },

    getModeratorUids: async function (): Promise<string[]> {
        const cids: string[] = await categories.getAllCidsFromSet('categories:cid');
        const uids: string[] = await categories.getModeratorUids(cids);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        return _.union(...uids);
    },

    getModeratedCids: async function (uid: string): Promise<string[]> {
        if (parseInt(uid, 10) <= 0) {
            return [];
        }
        const cids: string[] = await categories.getAllCidsFromSet('categories:cid');
        const isMods: boolean = await User.isModerator(uid, cids);
        return cids.filter((cid: string, index: number) => cid && isMods[index]);
    },

    addInterstitials: function (callback: () => void) {
        plugins.hooks.register('core', {
            hook: 'filter:register.interstitial',
            method: [
                module.exports.interstitials.email, // Email address (for password reset + digest)
                module.exports.interstitials.gdpr, // GDPR information collection/processing consent + email consent
                module.exports.interstitials.tou, // Forum Terms of Use
            ],
        });

        callback();
    },
};

// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
require('../promisify');

export = User;
