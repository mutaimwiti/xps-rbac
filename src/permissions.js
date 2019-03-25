import requireAll from "require-all";

/**
 * Generate the full group permission string for the passed permission i.e if
 * the permission is [user.create] it returns [user.*] which is the full
 * permission for the user permission group. If the permission is
 * already a full group permission it returns it.
 *
 * @param permission
 * @returns {*}
 */
export const getFullGroupPermission = permission => {
  if (permission.indexOf("*") >= 0) {
    return permission;
  }
  return `${permission.substr(0, permission.lastIndexOf("."))}.*`;
};

/**
 * Check whether the user has any valid permission. If the list of valid permissions
 * is empty it returns true since it is basically checking against nothing.
 *
 * @param userPermissions
 * @param validPermissions
 * @returns boolean
 */
export const hasAnyPermission = (userPermissions, validPermissions) => {
  if (!validPermissions.length) {
    return true;
  }

  let hasAnyValid = false;

  validPermissions.forEach(permission => {
    if (
      userPermissions.indexOf(permission) >= 0 ||
      userPermissions.indexOf(getFullGroupPermission(permission)) >= 0
    ) {
      hasAnyValid = true;
    }
  });

  return hasAnyValid;
};

/**
 * Check whether the user has all the required permissions. If the list of required permissions
 * is empty it returns true since it is basically checking against nothing.
 *
 * @param userPermissions
 * @param requiredPermissions
 * @returns boolean
 */
export const hasAllPermissions = (userPermissions, requiredPermissions) => {
  let hasAllRequired = true;

  requiredPermissions.forEach(permission => {
    if (
      userPermissions.indexOf(permission) < 0 &&
      userPermissions.indexOf(getFullGroupPermission(permission)) < 0
    ) {
      hasAllRequired = false;
    }
  });

  return hasAllRequired;
};

/**
 * Loads the permissions defined on the specified path. When loading, the permission
 * objects are added to an object. The actions are each prefixed with the name of
 * the entity. It also adds an object with all the permissions.
 *
 * @param pathName
 * @returns {{$all: {}}}
 */
export const loadPermissions = pathName => {
  const permissions = {
    $all: {}
  };
  const permissionsObj = requireAll(pathName);
  Object.keys(permissionsObj).forEach(permission => {
    const actions = {};
    const actionsObj = permissionsObj[permission].default;
    Object.keys(actionsObj).forEach(action => {
      actions[`${permission}.${action}`] = actionsObj[action];
    });
    permissions.$all = { ...permissions.$all, ...actions };
    permissions[permission] = actions;
  });
  return permissions;
};

/**
 * Checks a list of permissions against the system permissions. It returns an
 * object with two values: valid (boolean) indicating whether its valid and
 * invalids (list) with any invalid permission that may be found.
 *
 * @param systemPermissions
 * @param permissions
 * @returns {{invalids: Array, isValid: boolean}}
 */
export const validatePermissions = (systemPermissions, permissions) => {
  let isValid = true;
  const invalids = [];
  const systemPermissionKeys = Object.keys(systemPermissions);
  permissions.forEach(permission => {
    if (systemPermissionKeys.indexOf(permission) < 0) {
      isValid = false;
      invalids.push(permission);
    }
  });
  return { isValid, invalids };
};

/**
 * Get an array containing mappings (key : description) of permissions. These are
 * against the system pe
 *
 * @param systemPermissions
 * @param permissions
 * @returns {Array}
 */
export const getPermissionsMapArray = (systemPermissions, permissions) => {
  const permissionsArray = [];

  permissions.forEach(permission => {
    permissionsArray.push({ [permission]: systemPermissions[permission] });
  });

  return permissionsArray;
};

/**
 * Get all the permissions for an entity. For example passing 'x' will
 * return [ 'x.*', 'x.view', 'c.create', ..., ].
 *
 * @param systemPermissions
 * @param entity
 * @returns {string[]}
 */
export const getAllPermissionsFor = (systemPermissions, entity) => {
  return Object.keys(systemPermissions).filter(permission =>
    permission.startsWith(entity)
  );
};
