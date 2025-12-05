import { env } from 'common/constants'

const shouldLog = env.NODE_ENV !== 'production'

/**
 * This fixes an issue in Google Chrome for users who have auto-translate
 * enabled. The feature manipulates the DOM but does not account for the case
 * below, which in the context of React is Nodes having different parents than expected
 * due to the use of fragments. The linked GitHub issue has a more in depth explanation and
 * is the source of this solution (posted by one of React's core team members).
 *
 * @ref https://sentry.io/organizations/roobet/issues/3073434759/
 * @see https://github.com/facebook/react/issues/11538#issuecomment-417504600
 */
export const registerLenientDOMNodeOps = () => {
  if (typeof Node === 'function' && Node.prototype) {
    const originalRemoveChild = Node.prototype.removeChild

    Node.prototype.removeChild = function (child) {
      if (child.parentNode !== this) {
        if (shouldLog) {
          console.error(
            'Cannot remove a child from a different parent',
            child,
            this,
          )
        }

        return child
      }

      return originalRemoveChild.apply(this, [child])
    }

    const originalInsertBefore = Node.prototype.insertBefore

    Node.prototype.insertBefore = function (newNode, referenceNode) {
      if (referenceNode && referenceNode.parentNode !== this) {
        if (shouldLog) {
          console.error(
            'Cannot insert before a reference node from a different parent',
            referenceNode,
            this,
          )
        }

        return newNode
      }

      return originalInsertBefore.apply(this, [newNode, referenceNode])
    }
  }
}
