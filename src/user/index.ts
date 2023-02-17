import _ = require('lodash');

import groups = require('../groups');
import plugins = require('../plugins');
import db = require('../database');
import privileges = require('../privileges');
import categories = require('../categories');
import meta = require('../meta');
import utils = require('../utils');

const User = module.exports;
export default User;

User.email = require('./email');
User.notifications = require('./notifications');
User.reset = require('./reset');
User.digest = require('./digest');
User.interstitials = require('./interstitials');

require('./data')(User);
require('./auth')(User);
require('./bans')(User);
require('./create')(User);
require('./posts')(User);
require('./topics')(User);
require('./categories')(User);
require('./follow')(User);
require('./profile')(User);
require('./admin')(User);
require('./delete')(User);
require('./settings')(User);
require('./search')(User);
require('./jobs')(User);
require('./picture')(User);
require('./approval')(User);
require('./invite')(User);
require('./password')(User);
require('./info')(User);
require('./online')(User);
require('./blocks')(User);
require('./uploads')(User);

export async function exists(uids: number[]): Promise<boolean> {
    return await (
        Array.isArray(uids) ?
            db.isSortedSetMembers('users:joindate', uids) :
            db.isSortedSetMember('users:joindate', uids)
    );
}

export async function existsBySlug(userslug) {
    const exists = await getUidByUserslug(userslug);
    return !!exists;
}

export async function getUidsFromSet(set: string, start: number, stop: string) {
    if (set === 'users:online') {
        const count: number = parseInt(stop, 10) === -1 ? parseInt(stop, 10) : parseInt(stop, 10) - start + 1;
        const now = Date.now();
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        return await db.getSortedSetRevRangeByScore(set, start, count, '+inf', now - (meta.config.onlineCutoff * 60000));
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    return await db.getSortedSetRevRange(set, start, stop);
}

export async function getUsersFromSet(set: string, uid: number, start: number, stop: string) {
    const uids: number[] = await getUidsFromSet(set, start, stop);
    return await User.getUsers(uids, uid);
}

export async function getUsersWithFields(uids, fields, uid) {
    let results = await plugins.hooks.fire('filter:users.addFields', { fields: fields });
    results.fields = _.uniq(results.fields);
    const userData = await User.getUsersFields(uids, results.fields);
    results = await plugins.hooks.fire('filter:userlist.get', { users: userData, uid: uid });
    return results.users;
}

export async function getUsers(uids, uid) {
    const userData = await User.getUsersWithFields(uids, [
        'uid', 'username', 'userslug', 'accounttype', 'picture', 'status',
        'postcount', 'reputation', 'email:confirmed', 'lastonline',
        'flags', 'banned', 'banned:expire', 'joindate',
    ], uid);

    return User.hidePrivateData(userData, uid);
}

export function getStatus(userData) {
    if (userData.uid <= 0) {
        return 'offline';
    }
    const isOnline = (Date.now() - userData.lastonline) < (meta.config.onlineCutoff * 60000);
    return isOnline ? (userData.status || 'online') : 'offline';
}

export async function getUidByUsername(username) {
    if (!username) {
        return 0;
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    return await db.sortedSetScore('username:uid', username);
}

export async function getUidsByUsernames (usernames) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    return await db.sortedSetScores('username:uid', usernames);
}

export async function getUidByUserslug(userslug) {
    if (!userslug) {
        return 0;
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    return await db.sortedSetScore('userslug:uid', userslug);
}

export async function getUsernamesByUids(uids) {
    const users = await User.getUsersFields(uids, ['username']);
    return users.map(user => user.username);
}

export async function getUsernameByUserslug(slug) {
    const uid = await User.getUidByUserslug(slug);
    return await User.getUserField(uid, 'username');
}

export async function getUidByEmail(email) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    return await db.sortedSetScore('email:uid', email.toLowerCase());
};

export async function getUidsByEmails(emails) {
    emails = emails.map(email => email && email.toLowerCase());
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    return await db.sortedSetScores('email:uid', emails);
};

export async function getUsernameByEmail(email) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const uid = await db.sortedSetScore('email:uid', String(email).toLowerCase());
    return await User.getUserField(uid, 'username');
};

export async function isModerator(uid, cid) {
    return await privileges.users.isModerator(uid, cid);
};

export async function isModeratorOfAnyCategory(uid): Promise<boolean> {
    const cids = await User.getModeratedCids(uid);
    return Array.isArray(cids) ? !!cids.length : false;
};

export async function isAdministrator(uid: number): Promise<boolean> {
    if (await privileges.users.isAdministrator(uid)) {
        return true;
    }
    const accounttype = await User.getUserField(uid, 'accounttype');
    if (accounttype === 'instructor') {
        console.log(accounttype);
        return true;
    }
    // return false if user is not instructor or admin
    return false;
}

export async function isGlobalModerator(uid) {
    return await privileges.users.isGlobalModerator(uid);
}

export async function getPrivileges(uid) {
    return await utils.promiseParallel({
        isAdmin: User.isAdministrator(uid),
        isGlobalModerator: User.isGlobalModerator(uid),
        isModeratorOfAnyCategory: User.isModeratorOfAnyCategory(uid),
    });
}

export async function isPrivileged(uid: string) {
    if (!(parseInt(uid, 10) > 0)) {
        return false;
    }
    const results = await User.getPrivileges(uid);
    return results ? (results.isAdmin || results.isGlobalModerator || results.isModeratorOfAnyCategory) : false;
}

export async function isAdminOrGlobalMod(uid) {
    const [isAdmin, isGlobalMod] = await Promise.all([
        User.isAdministrator(uid),
        User.isGlobalModerator(uid),
    ]);
    return isAdmin || isGlobalMod;
}

export async function isAdminOrSelf(callerUid, uid) {
    await isSelfOrMethod(callerUid, uid, User.isAdministrator);
}

export async function isAdminOrGlobalModOrSelf(callerUid, uid) {
    await isSelfOrMethod(callerUid, uid, User.isAdminOrGlobalMod);
}

export async function isPrivilegedOrSelf(callerUid, uid) {
    await isSelfOrMethod(callerUid, uid, User.isPrivileged);
}

async function isSelfOrMethod(callerUid: string, uid: string, method) {
    if (parseInt(callerUid, 10) === parseInt(uid, 10)) {
        return;
    }
    const isPass = await method(callerUid);
    if (!isPass) {
        throw new Error('[[error:no-privileges]]');
    }
}

export async function getAdminsandGlobalMods() {
    const results = await groups.getMembersOfGroups(['administrators', 'Global Moderators']);
    return await User.getUsersData(_.union(...results));
}

export async function getAdminsandGlobalModsandModerators() {
    const results = await Promise.all([
        groups.getMembers('administrators', 0, -1),
        groups.getMembers('Global Moderators', 0, -1),
        User.getModeratorUids(),
    ]);
    return await User.getUsersData(_.union(...results));
}

export async function getFirstAdminUid() {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    return (await db.getSortedSetRange('group:administrators:members', 0, 0))[0];
}

export async function getModeratorUids() {
    const cids = await categories.getAllCidsFromSet('categories:cid');
    const uids = await categories.getModeratorUids(cids);
    return _.union(...uids);
}

export async function getModeratedCids(uid: string) {
    if (parseInt(uid, 10) <= 0) {
        return [];
    }
    const cids = await categories.getAllCidsFromSet('categories:cid');
    const isMods = await User.isModerator(uid, cids);
    return cids.filter((cid, index) => cid && isMods[index]);
}

export function addInterstitials(callback) {
    plugins.hooks.register('core', {
        hook: 'filter:register.interstitial',
        method: [
            User.interstitials.email, // Email address (for password reset + digest)
            User.interstitials.gdpr, // GDPR information collection/processing consent + email consent
            User.interstitials.tou, // Forum Terms of Use
        ],
    });

    callback();
}

require('../promisify')(User);
