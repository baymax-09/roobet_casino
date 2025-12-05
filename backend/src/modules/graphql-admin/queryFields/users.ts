import { booleanArg, list, nonNull, queryField } from 'nexus'

import { getUsers } from 'src/modules/user'

export const UsersQueryField = queryField('users', {
  type: nonNull(list(nonNull('User'))),
  description: `
    Returns a list of Users based on the supplied filters.
  `,
  args: {
    isStaff: booleanArg({
      description: `
          The flag indicating whether or not the User is a staff member. 
          If true, will only return staff members.
          If false, will only return non-staff members.
          If null | undefined, will return all Users.
        `,
    }),
  },
  auth: {
    authenticated: true,
    accessRules: [{ resource: 'account', action: 'read' }],
  },
  resolve: async (_, { isStaff }) => {
    /*
     * This query currently is not paginated, but probably should be in the future.
     * This query was originally written for this card, which specifically said not to use pagination: https://roobetapp.atlassian.net/browse/PD-2730.
     * Presumably, because it would take more time to develop. In any case, if/when it needs to be paginated,
     * we will make a `usersPaginated` query. Base it off the pattern established with `tpGamesPaginated`.
     */
    const filter = {} // No primitive filters yet
    return await getUsers({ filter, isStaff })
  },
})
