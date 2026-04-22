const ROLES = Object.freeze({
  USER: "user",
  COACH: "coach",
  ADMIN: "admin",
  SELLER: "seller",
  AFFILIATE: "affiliate",
});

const ALL_ROLES = Object.freeze(Object.values(ROLES));

const ROLE_GROUPS = Object.freeze({
  CORE_APP: Object.freeze([ROLES.USER, ROLES.COACH, ROLES.ADMIN]),
  COMMERCE: Object.freeze([ROLES.SELLER, ROLES.AFFILIATE, ROLES.ADMIN]),
});

module.exports = {
  ROLES,
  ALL_ROLES,
  ROLE_GROUPS,
};
