import _ = require('lodash');

import groups = require('../groups');
import plugins = require('../plugins');
import db = require('../database');
import privileges = require('../privileges');
import categories = require('../categories');
import meta = require('../meta');
import utils = require('../utils');
import data = require('./data');

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

/// look at getusers for fields
type UserData = {
    uid : number
    username : string
    userslug : string
    accounttype : string
    postcount : number
    joindate : number
    status : string
    fullname : string
    password : string
    email : string
    callback : () => void
}

const User = {
    /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-var-requires */
    email: require('./email'),
    notifications: require('./notifications'),
    reset: require('./reset'),
    digest: require('./digest'),
    interstitials: require('./interstitials'),
    /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-var-requires */

    exists: async function (uids: string[] | string): Promise<boolean> {
        if (Array.isArray(uids)) {
            // The next line calls a function in a module that has not been updated to TS yet
            /* eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call,
            @typescript-eslint/no-unsafe-member-access */
            return await db.isSortedSetMembers('users:joindate', uids);
        }
        // The next line calls a function in a module that has not been updated to TS yet
        /* eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call,
        @typescript-eslint/no-unsafe-member-access */
        return await db.isSortedSetMember('users:joindate', uids);
    },

    existsBySlug: async function (userslug: string): Promise<boolean> {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const exists: number = await User.getUidByUserslug(userslug);
        return !!exists;
    },

    getUidsFromSet: async function (set: string, start: string, stop: string): Promise<string[]> {
        if (set === 'users:online') {
            const count: number = parseInt(stop, 10) === -1 ? parseInt(stop, 10) :
                parseInt(stop, 10) - parseInt(start, 10) + 1;
            const now: number = Date.now();
            // The next line calls a function in a module that has not been updated to TS yet
            /* eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call,
            @typescript-eslint/no-unsafe-member-access */
            return await db.getSortedSetRevRangeByScore(set, start, count, '+inf', now - (meta.config.onlineCutoff * 60000));
        }
        // The next line calls a function in a module that has not been updated to TS yet
        /* eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call,
        @typescript-eslint/no-unsafe-member-access */
        return await db.getSortedSetRevRange(set, start, stop);
    },

    getUsersFromSet: async function (set: string, uid: string, start: string, stop: string): Promise<UserData[]> {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        const uids: string[] = await User.getUidsFromSet(set, start, stop);
        return await User.getUsers(uids, uid);
    },

    getUsersWithFields: async function (uids: string[], fields: string[], uid: string): Promise<UserData[]> {
        /* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call,
         @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument,
         @typescript-eslint/no-unsafe-return */
        let results = await plugins.hooks.fire('filter:users.addFields', { fields: fields });
        results.fields = _.uniq(results.fields);
        const userData: [] = await data.getUsersFields(uids, results.fields);
        results = await plugins.hooks.fire('filter:userlist.get', { users: userData, uid: uid });
        return results.users;
        /* eslint-enable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call,
        @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument,
        @typescript-eslint/no-unsafe-return */
    },

    getUsers: async function (uids: string[], uid: string): Promise<UserData[]> {
        const userData = await User.getUsersWithFields(uids, [
            'uid', 'username', 'userslug', 'accounttype', 'picture', 'status',
            'postcount', 'reputation', 'email:confirmed', 'lastonline',
            'flags', 'banned', 'banned:expire', 'joindate',
        ], uid);
        // The next line calls a function in a module that has not been updated to TS yet
        /* eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call,
        @typescript-eslint/no-unsafe-member-access */
        return module.exports.hidePrivateData(userData, uid);
    },

    getStatus: function (userData: { uid: number; lastonline: number; status: string; }): string {
        if (userData.uid <= 0) {
            return 'offline';
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        const isOnline: boolean = (Date.now() - userData.lastonline) < (meta.config.onlineCutoff * 60000);
        return isOnline ? (userData.status || 'online') : 'offline';
    },

    getUidByUsername: async function (username: string): Promise<number> {
        if (!username) {
            return 0;
        }
        // The next line calls a function in a module that has not been updated to TS yet
        /* eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call,
        @typescript-eslint/no-unsafe-member-access */
        return await db.sortedSetScore('username:uid', username);
    },

    getUidsByUsernames: async function getUidsByUsernames(usernames: string[]): Promise<string[]> {
        // The next line calls a function in a module that has not been updated to TS yet
        /* eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call,
        @typescript-eslint/no-unsafe-member-access */
        return await db.sortedSetScores('username:uid', usernames);
    },

    getUidByUserslug: async function (userslug: string): Promise<number> {
        if (!userslug) {
            return 0;
        }
        // The next line calls a function in a module that has not been updated to TS yet
        /* eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call,
        @typescript-eslint/no-unsafe-member-access */
        return await db.sortedSetScore('userslug:uid', userslug);
    },

    getUsernamesByUids: async function (uids: string[]): Promise<string[]> {
        /* eslint-disable @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call,
        @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
        const users = await data.getUsersFields(uids, ['username']);
        return users.map((user: { username: string; }) => user.username);
        /* eslint-enable @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call,
        @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
    },

    getUsernameByUserslug: async function (slug: string): Promise<string> {
        /* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call,
        @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
        const uid: number = await User.getUidByUserslug(slug);
        return await module.exports.getUserField(uid, 'username');
        /* eslint-enable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call,
        @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
    },

    getUidByEmail: async function (email: string): Promise<number> {
        /* eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call,
        @typescript-eslint/no-unsafe-member-access */
        return await db.sortedSetScore('email:uid', email.toLowerCase());
    },

    getUidsByEmails: async function (emails: string[]): Promise<number[]> {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        emails = emails.map(email => email && email.toLowerCase());
        /* eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call,
        @typescript-eslint/no-unsafe-member-access */
        return await db.sortedSetScores('email:uid', emails);
    },

    getUsernameByEmail: async function (email: string): Promise<string> {
        /* eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call,
        @typescript-eslint/no-unsafe-assignment */
        const uid: string = await db.sortedSetScore('email:uid', String(email).toLowerCase());
        /* eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call,
        @typescript-eslint/no-unsafe-return */
        return await module.exports.getUserField(uid, 'username');
    },

    isModerator: async function (uid: string, cid: string | string[]): Promise<boolean> {
        /* eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call,
        @typescript-eslint/no-unsafe-return */
        return await privileges.users.isModerator(uid, cid);
    },

    isModeratorOfAnyCategory: async function (uid: string): Promise<boolean> {
        /* eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call,
        @typescript-eslint/no-unsafe-assignment */
        const cids = await User.getModeratedCids(uid);
        return Array.isArray(cids) ? !!cids.length : false;
    },

    isAdministrator: async function (uid: string): Promise<boolean> {
        /* eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call,
        @typescript-eslint/no-unsafe-member-access */
        if (await privileges.users.isAdministrator(uid)) {
            return true;
        }
        /* eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call,
        @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
        const accounttype: string = await module.exports.getUserField(uid, 'accounttype');
        if (accounttype === 'instructor') {
            return true;
        }
        // return false if user is not instructor or admin
        return false;
    },

    isGlobalModerator: async function (uid: string): Promise<boolean> {
        // The next line calls a function in a module that has not been updated to TS yet
        /* eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call,
        @typescript-eslint/no-unsafe-member-access */
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

    isSelfOrMethod: async function (callerUid: string, uid: string, method: (arg0: string)
     => Promise<boolean>): Promise<void> {
        if (parseInt(callerUid, 10) === parseInt(uid, 10)) {
            return;
        }
        const isPass: boolean = await method(callerUid);
        if (!isPass) {
            throw new Error('[[error:no-privileges]]');
        }
    },

    getAdminsandGlobalMods: async function (): Promise<string[]> {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
        const results: string[] = await groups.getMembersOfGroups(['administrators', 'Global Moderators']);
        /* eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call,
        @typescript-eslint/no-unsafe-return */
        return await module.exports.getUsersData(_.union(...results));
    },

    getAdminsandGlobalModsandModerators: async function (): Promise<string[]> {
        /* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call,
        @typescript-eslint/no-unsafe-assignment */
        const results: string[] = await Promise.all([
            groups.getMembers('administrators', 0, -1),
            groups.getMembers('Global Moderators', 0, -1),
            User.getModeratorUids(),
        ]);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return await module.exports.getUsersData(_.union(...results));
        /* eslint-enable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call,
        @typescript-eslint/no-unsafe-assignment */
    },

    getFirstAdminUid: async function (): Promise<string> {
        // The next line calls a function in a module that has not been updated to TS yet
        /* eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call,
        @typescript-eslint/no-unsafe-member-access */
        return (await db.getSortedSetRange('group:administrators:members', 0, 0))[0];
    },

    getModeratorUids: async function (): Promise<string[]> {
        /* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call,
        @typescript-eslint/no-unsafe-assignment */
        const cids: string[] = await categories.getAllCidsFromSet('categories:cid');
        const uids: string[] = await categories.getModeratorUids(cids);
        return _.union(...uids);
        /* eslint-enable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call,
        @typescript-eslint/no-unsafe-assignment */
    },

    getModeratedCids: async function (uid: string): Promise<string[]> {
        if (parseInt(uid, 10) <= 0) {
            return [];
        }
        // The next line calls a function in a module that has not been updated to TS yet
        /* eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call,
        @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
        const cids: string[] = await categories.getAllCidsFromSet('categories:cid');
        const isMods: boolean = await User.isModerator(uid, cids);
        // The next line calls a function in a module that has not been updated to TS yet
        /* eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call,
        @typescript-eslint/no-unsafe-member-access */
        return cids.filter((cid: string, index: number) => cid && isMods[index]);
    },

    addInterstitials: function (callback: () => void): void {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        plugins.hooks.register('core', {
            hook: 'filter:register.interstitial',
            method: [
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                module.exports.interstitials.email, // Email address (for password reset + digest)
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                module.exports.interstitials.gdpr, // GDPR information collection/processing consent + email consent
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                module.exports.interstitials.tou, // Forum Terms of Use
            ],
        });

        callback();
    },
};

// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
require('../promisify');

export = User;
