const ROLES = Object.freeze({
  USER: "user",
  COACH: "coach",
  ADMIN: "admin",
  SELLER: "seller",
  AFFILIATE: "affiliate",
  DOCTOR: "doctor",
});

const ALL_ROLES = Object.freeze(Object.values(ROLES));

const ROLE_GROUPS = Object.freeze({
  CORE_APP: Object.freeze([ROLES.USER, ROLES.COACH, ROLES.ADMIN, ROLES.DOCTOR]),
  COMMERCE: Object.freeze([
    ROLES.SELLER,
    ROLES.AFFILIATE,
    ROLES.ADMIN,
    ROLES.DOCTOR,
  ]),
});

module.exports = {
  ROLES,
  ALL_ROLES,
  ROLE_GROUPS,
};
