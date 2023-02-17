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
Object.defineProperty(exports, "__esModule", { value: true });
exports.addInterstitials = exports.getModeratedCids = exports.getModeratorUids = exports.getFirstAdminUid = exports.getAdminsandGlobalModsandModerators = exports.getAdminsandGlobalMods = exports.isPrivilegedOrSelf = exports.isAdminOrGlobalModOrSelf = exports.isAdminOrSelf = exports.isAdminOrGlobalMod = exports.isPrivileged = exports.getPrivileges = exports.isGlobalModerator = exports.isAdministrator = exports.isModeratorOfAnyCategory = exports.isModerator = exports.getUsernameByEmail = exports.getUidsByEmails = exports.getUidByEmail = exports.getUsernameByUserslug = exports.getUsernamesByUids = exports.getUidByUserslug = exports.getUidsByUsernames = exports.getUidByUsername = exports.getStatus = exports.getUsers = exports.getUsersWithFields = exports.getUsersFromSet = exports.getUidsFromSet = exports.existsBySlug = exports.exists = void 0;
const _ = require("lodash");
const groups = require("../groups");
const plugins = require("../plugins");
const db = require("../database");
const privileges = require("../privileges");
const categories = require("../categories");
const meta = require("../meta");
const utils = require("../utils");
const User = module.exports;
exports.default = User;
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
function exists(uids) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield (Array.isArray(uids) ?
            db.isSortedSetMembers('users:joindate', uids) :
            db.isSortedSetMember('users:joindate', uids));
    });
}
exports.exists = exists;
function existsBySlug(userslug) {
    return __awaiter(this, void 0, void 0, function* () {
        const exists = yield getUidByUserslug(userslug);
        return !!exists;
    });
}
exports.existsBySlug = existsBySlug;
function getUidsFromSet(set, start, stop) {
    return __awaiter(this, void 0, void 0, function* () {
        if (set === 'users:online') {
            const count = parseInt(stop, 10) === -1 ? parseInt(stop, 10) : parseInt(stop, 10) - start + 1;
            const now = Date.now();
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            return yield db.getSortedSetRevRangeByScore(set, start, count, '+inf', now - (meta.config.onlineCutoff * 60000));
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        return yield db.getSortedSetRevRange(set, start, stop);
    });
}
exports.getUidsFromSet = getUidsFromSet;
function getUsersFromSet(set, uid, start, stop) {
    return __awaiter(this, void 0, void 0, function* () {
        const uids = yield getUidsFromSet(set, start, stop);
        return yield User.getUsers(uids, uid);
    });
}
exports.getUsersFromSet = getUsersFromSet;
function getUsersWithFields(uids, fields, uid) {
    return __awaiter(this, void 0, void 0, function* () {
        let results = yield plugins.hooks.fire('filter:users.addFields', { fields: fields });
        results.fields = _.uniq(results.fields);
        const userData = yield User.getUsersFields(uids, results.fields);
        results = yield plugins.hooks.fire('filter:userlist.get', { users: userData, uid: uid });
        return results.users;
    });
}
exports.getUsersWithFields = getUsersWithFields;
function getUsers(uids, uid) {
    return __awaiter(this, void 0, void 0, function* () {
        const userData = yield User.getUsersWithFields(uids, [
            'uid', 'username', 'userslug', 'accounttype', 'picture', 'status',
            'postcount', 'reputation', 'email:confirmed', 'lastonline',
            'flags', 'banned', 'banned:expire', 'joindate',
        ], uid);
        return User.hidePrivateData(userData, uid);
    });
}
exports.getUsers = getUsers;
function getStatus(userData) {
    if (userData.uid <= 0) {
        return 'offline';
    }
    const isOnline = (Date.now() - userData.lastonline) < (meta.config.onlineCutoff * 60000);
    return isOnline ? (userData.status || 'online') : 'offline';
}
exports.getStatus = getStatus;
function getUidByUsername(username) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!username) {
            return 0;
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        return yield db.sortedSetScore('username:uid', username);
    });
}
exports.getUidByUsername = getUidByUsername;
function getUidsByUsernames(usernames) {
    return __awaiter(this, void 0, void 0, function* () {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        return yield db.sortedSetScores('username:uid', usernames);
    });
}
exports.getUidsByUsernames = getUidsByUsernames;
function getUidByUserslug(userslug) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!userslug) {
            return 0;
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        return yield db.sortedSetScore('userslug:uid', userslug);
    });
}
exports.getUidByUserslug = getUidByUserslug;
function getUsernamesByUids(uids) {
    return __awaiter(this, void 0, void 0, function* () {
        const users = yield User.getUsersFields(uids, ['username']);
        return users.map(user => user.username);
    });
}
exports.getUsernamesByUids = getUsernamesByUids;
function getUsernameByUserslug(slug) {
    return __awaiter(this, void 0, void 0, function* () {
        const uid = yield User.getUidByUserslug(slug);
        return yield User.getUserField(uid, 'username');
    });
}
exports.getUsernameByUserslug = getUsernameByUserslug;
function getUidByEmail(email) {
    return __awaiter(this, void 0, void 0, function* () {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        return yield db.sortedSetScore('email:uid', email.toLowerCase());
    });
}
exports.getUidByEmail = getUidByEmail;
;
function getUidsByEmails(emails) {
    return __awaiter(this, void 0, void 0, function* () {
        emails = emails.map(email => email && email.toLowerCase());
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        return yield db.sortedSetScores('email:uid', emails);
    });
}
exports.getUidsByEmails = getUidsByEmails;
;
function getUsernameByEmail(email) {
    return __awaiter(this, void 0, void 0, function* () {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        const uid = yield db.sortedSetScore('email:uid', String(email).toLowerCase());
        return yield User.getUserField(uid, 'username');
    });
}
exports.getUsernameByEmail = getUsernameByEmail;
;
function isModerator(uid, cid) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield privileges.users.isModerator(uid, cid);
    });
}
exports.isModerator = isModerator;
;
function isModeratorOfAnyCategory(uid) {
    return __awaiter(this, void 0, void 0, function* () {
        const cids = yield User.getModeratedCids(uid);
        return Array.isArray(cids) ? !!cids.length : false;
    });
}
exports.isModeratorOfAnyCategory = isModeratorOfAnyCategory;
;
function isAdministrator(uid) {
    return __awaiter(this, void 0, void 0, function* () {
        if (yield privileges.users.isAdministrator(uid)) {
            return true;
        }
        const accounttype = yield User.getUserField(uid, 'accounttype');
        if (accounttype === 'instructor') {
            console.log(accounttype);
            return true;
        }
        // return false if user is not instructor or admin
        return false;
    });
}
exports.isAdministrator = isAdministrator;
function isGlobalModerator(uid) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield privileges.users.isGlobalModerator(uid);
    });
}
exports.isGlobalModerator = isGlobalModerator;
function getPrivileges(uid) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield utils.promiseParallel({
            isAdmin: User.isAdministrator(uid),
            isGlobalModerator: User.isGlobalModerator(uid),
            isModeratorOfAnyCategory: User.isModeratorOfAnyCategory(uid),
        });
    });
}
exports.getPrivileges = getPrivileges;
function isPrivileged(uid) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!(parseInt(uid, 10) > 0)) {
            return false;
        }
        const results = yield User.getPrivileges(uid);
        return results ? (results.isAdmin || results.isGlobalModerator || results.isModeratorOfAnyCategory) : false;
    });
}
exports.isPrivileged = isPrivileged;
function isAdminOrGlobalMod(uid) {
    return __awaiter(this, void 0, void 0, function* () {
        const [isAdmin, isGlobalMod] = yield Promise.all([
            User.isAdministrator(uid),
            User.isGlobalModerator(uid),
        ]);
        return isAdmin || isGlobalMod;
    });
}
exports.isAdminOrGlobalMod = isAdminOrGlobalMod;
function isAdminOrSelf(callerUid, uid) {
    return __awaiter(this, void 0, void 0, function* () {
        yield isSelfOrMethod(callerUid, uid, User.isAdministrator);
    });
}
exports.isAdminOrSelf = isAdminOrSelf;
function isAdminOrGlobalModOrSelf(callerUid, uid) {
    return __awaiter(this, void 0, void 0, function* () {
        yield isSelfOrMethod(callerUid, uid, User.isAdminOrGlobalMod);
    });
}
exports.isAdminOrGlobalModOrSelf = isAdminOrGlobalModOrSelf;
function isPrivilegedOrSelf(callerUid, uid) {
    return __awaiter(this, void 0, void 0, function* () {
        yield isSelfOrMethod(callerUid, uid, User.isPrivileged);
    });
}
exports.isPrivilegedOrSelf = isPrivilegedOrSelf;
function isSelfOrMethod(callerUid, uid, method) {
    return __awaiter(this, void 0, void 0, function* () {
        if (parseInt(callerUid, 10) === parseInt(uid, 10)) {
            return;
        }
        const isPass = yield method(callerUid);
        if (!isPass) {
            throw new Error('[[error:no-privileges]]');
        }
    });
}
function getAdminsandGlobalMods() {
    return __awaiter(this, void 0, void 0, function* () {
        const results = yield groups.getMembersOfGroups(['administrators', 'Global Moderators']);
        return yield User.getUsersData(_.union(...results));
    });
}
exports.getAdminsandGlobalMods = getAdminsandGlobalMods;
function getAdminsandGlobalModsandModerators() {
    return __awaiter(this, void 0, void 0, function* () {
        const results = yield Promise.all([
            groups.getMembers('administrators', 0, -1),
            groups.getMembers('Global Moderators', 0, -1),
            User.getModeratorUids(),
        ]);
        return yield User.getUsersData(_.union(...results));
    });
}
exports.getAdminsandGlobalModsandModerators = getAdminsandGlobalModsandModerators;
function getFirstAdminUid() {
    return __awaiter(this, void 0, void 0, function* () {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        return (yield db.getSortedSetRange('group:administrators:members', 0, 0))[0];
    });
}
exports.getFirstAdminUid = getFirstAdminUid;
function getModeratorUids() {
    return __awaiter(this, void 0, void 0, function* () {
        const cids = yield categories.getAllCidsFromSet('categories:cid');
        const uids = yield categories.getModeratorUids(cids);
        return _.union(...uids);
    });
}
exports.getModeratorUids = getModeratorUids;
function getModeratedCids(uid) {
    return __awaiter(this, void 0, void 0, function* () {
        if (parseInt(uid, 10) <= 0) {
            return [];
        }
        const cids = yield categories.getAllCidsFromSet('categories:cid');
        const isMods = yield User.isModerator(uid, cids);
        return cids.filter((cid, index) => cid && isMods[index]);
    });
}
exports.getModeratedCids = getModeratedCids;
function addInterstitials(callback) {
    plugins.hooks.register('core', {
        hook: 'filter:register.interstitial',
        method: [
            User.interstitials.email,
            User.interstitials.gdpr,
            User.interstitials.tou, // Forum Terms of Use
        ],
    });
    callback();
}
exports.addInterstitials = addInterstitials;
require('../promisify')(User);
