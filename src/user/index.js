"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const _ = require("lodash");
const groups = require("../groups");
const plugins = require("../plugins");
const db = require("../database");
const privileges = require("../privileges");
const categories = require("../categories");
const meta = require("../meta");
const utils = require("../utils");
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
    exists: function (uids) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield (
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            Array.isArray(uids) ?
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                db.isSortedSetMembers('users:joindate', uids) :
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                db.isSortedSetMember('users:joindate', uids));
        });
    },
    existsBySlug: function (userslug) {
        return __awaiter(this, void 0, void 0, function* () {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
            const exists = yield User.getUidByUserslug(userslug);
            return !!exists;
        });
    },
    getUidsFromSet: function (set, start, stop) {
        return __awaiter(this, void 0, void 0, function* () {
            if (set === 'users:online') {
                const count = parseInt(stop, 10) === -1 ? parseInt(stop, 10) :
                    parseInt(stop, 10) - parseInt(start, 10) + 1;
                const now = Date.now();
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                return yield db.getSortedSetRevRangeByScore(set, start, count, '+inf', now - (meta.config.onlineCutoff * 60000));
            }
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            return yield db.getSortedSetRevRange(set, start, stop);
        });
    },
    getUsersFromSet: function (set, uid, start, stop) {
        return __awaiter(this, void 0, void 0, function* () {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            const uids = yield User.getUidsFromSet(set, start, stop);
            return yield User.getUsers(uids, uid);
        });
    },
    getUsersWithFields: function (uids, fields, uid) {
        return __awaiter(this, void 0, void 0, function* () {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            let results = yield plugins.hooks.fire('filter:users.addFields', { fields: fields });
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            results.fields = _.uniq(results.fields);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            const userData = yield module.exports.getUsersFields(uids, results.fields);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            results = yield plugins.hooks.fire('filter:userlist.get', { users: userData, uid: uid });
            return results.users;
        });
    },
    getUsers: function (uids, uid) {
        return __awaiter(this, void 0, void 0, function* () {
            const userData = yield User.getUsersWithFields(uids, [
                'uid', 'username', 'userslug', 'accounttype', 'picture', 'status',
                'postcount', 'reputation', 'email:confirmed', 'lastonline',
                'flags', 'banned', 'banned:expire', 'joindate',
            ], uid);
            return module.exports.hidePrivateData(userData, uid);
        });
    },
    getStatus: function (userData) {
        if (userData.uid <= 0) {
            return 'offline';
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        const isOnline = (Date.now() - userData.lastonline) < (meta.config.onlineCutoff * 60000);
        return isOnline ? (userData.status || 'online') : 'offline';
    },
    getUidByUsername: function getUidByUsername(username) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!username) {
                return 0;
            }
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            return yield db.sortedSetScore('username:uid', username);
        });
    },
    getUidsByUsernames: function getUidsByUsernames(usernames) {
        return __awaiter(this, void 0, void 0, function* () {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            return yield db.sortedSetScores('username:uid', usernames);
        });
    },
    getUidByUserslug: function (userslug) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!userslug) {
                return 0;
            }
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            return yield db.sortedSetScore('userslug:uid', userslug);
        });
    },
    getUsernamesByUids: function (uids) {
        return __awaiter(this, void 0, void 0, function* () {
            const users = yield module.exports.getUsersFields(uids, ['username']);
            return users.map((user) => user.username);
        });
    },
    getUsernameByUserslug: function (slug) {
        return __awaiter(this, void 0, void 0, function* () {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            const uid = yield User.getUidByUserslug(slug);
            return yield module.exports.getUserField(uid, 'username');
        });
    },
    getUidByEmail: function (email) {
        return __awaiter(this, void 0, void 0, function* () {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            return yield db.sortedSetScore('email:uid', email.toLowerCase());
        });
    },
    getUidsByEmails: function (emails) {
        return __awaiter(this, void 0, void 0, function* () {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            emails = emails.map(email => email && email.toLowerCase());
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            return yield db.sortedSetScores('email:uid', emails);
        });
    },
    getUsernameByEmail: function (email) {
        return __awaiter(this, void 0, void 0, function* () {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            const uid = yield db.sortedSetScore('email:uid', String(email).toLowerCase());
            return yield module.exports.getUserField(uid, 'username');
        });
    },
    isModerator: function (uid, cid) {
        return __awaiter(this, void 0, void 0, function* () {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            return yield privileges.users.isModerator(uid, cid);
        });
    },
    isModeratorOfAnyCategory: function (uid) {
        return __awaiter(this, void 0, void 0, function* () {
            const cids = yield module.exports.getModeratedCids(uid);
            return Array.isArray(cids) ? !!cids.length : false;
        });
    },
    isAdministrator: function (uid) {
        return __awaiter(this, void 0, void 0, function* () {
            if (yield privileges.users.isAdministrator(uid)) {
                return true;
            }
            const accounttype = yield module.exports.getUserField(uid, 'accounttype');
            if (accounttype === 'instructor') {
                console.log(accounttype);
                return true;
            }
            // return false if user is not instructor or admin
            return false;
        });
    },
    isGlobalModerator: function (uid) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield privileges.users.isGlobalModerator(uid);
        });
    },
    getPrivileges: function (uid) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield utils.promiseParallel({
                isAdmin: User.isAdministrator(uid),
                isGlobalModerator: User.isGlobalModerator(uid),
                isModeratorOfAnyCategory: User.isModeratorOfAnyCategory(uid),
            });
        });
    },
    isPrivileged: function (uid) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(parseInt(uid, 10) > 0)) {
                return false;
            }
            const results = yield User.getPrivileges(uid);
            return results ? (results.isAdmin || results.isGlobalModerator || results.isModeratorOfAnyCategory) : false;
        });
    },
    isAdminOrGlobalMod: function (uid) {
        return __awaiter(this, void 0, void 0, function* () {
            const [isAdmin, isGlobalMod] = yield Promise.all([
                User.isAdministrator(uid),
                User.isGlobalModerator(uid),
            ]);
            return isAdmin || isGlobalMod;
        });
    },
    isAdminOrSelf: function (callerUid, uid) {
        return __awaiter(this, void 0, void 0, function* () {
            yield User.isSelfOrMethod(callerUid, uid, User.isAdministrator);
        });
    },
    isAdminOrGlobalModOrSelf: function (callerUid, uid) {
        return __awaiter(this, void 0, void 0, function* () {
            yield User.isSelfOrMethod(callerUid, uid, User.isAdminOrGlobalMod);
        });
    },
    isPrivilegedOrSelf: function (callerUid, uid) {
        return __awaiter(this, void 0, void 0, function* () {
            yield User.isSelfOrMethod(callerUid, uid, User.isPrivileged);
        });
    },
    isSelfOrMethod: function (callerUid, uid, method) {
        return __awaiter(this, void 0, void 0, function* () {
            if (parseInt(callerUid, 10) === parseInt(uid, 10)) {
                return;
            }
            const isPass = yield method(callerUid);
            if (!isPass) {
                throw new Error('[[error:no-privileges]]');
            }
        });
    },
    getAdminsandGlobalMods: function () {
        return __awaiter(this, void 0, void 0, function* () {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            const results = yield groups.getMembersOfGroups(['administrators', 'Global Moderators']);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            return yield module.exports.getUsersData(_.union(...results));
        });
    },
    getAdminsandGlobalModsandModerators: function () {
        return __awaiter(this, void 0, void 0, function* () {
            const results = yield Promise.all([
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                groups.getMembers('administrators', 0, -1),
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                groups.getMembers('Global Moderators', 0, -1),
                User.getModeratorUids(),
            ]);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            return yield module.exports.getUsersData(_.union(...results));
        });
    },
    getFirstAdminUid: function () {
        return __awaiter(this, void 0, void 0, function* () {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            return (yield db.getSortedSetRange('group:administrators:members', 0, 0))[0];
        });
    },
    getModeratorUids: function () {
        return __awaiter(this, void 0, void 0, function* () {
            const cids = yield categories.getAllCidsFromSet('categories:cid');
            const uids = yield categories.getModeratorUids(cids);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            return _.union(...uids);
        });
    },
    getModeratedCids: function (uid) {
        return __awaiter(this, void 0, void 0, function* () {
            if (parseInt(uid, 10) <= 0) {
                return [];
            }
            const cids = yield categories.getAllCidsFromSet('categories:cid');
            const isMods = yield User.isModerator(uid, cids);
            return cids.filter((cid, index) => cid && isMods[index]);
        });
    },
    addInterstitials: function (callback) {
        plugins.hooks.register('core', {
            hook: 'filter:register.interstitial',
            method: [
                module.exports.interstitials.email,
                module.exports.interstitials.gdpr,
                module.exports.interstitials.tou, // Forum Terms of Use
            ],
        });
        callback();
    },
};
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
require('../promisify');
module.exports = User;
