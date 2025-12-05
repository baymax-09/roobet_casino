export const intercomProps = user => ({
  name: user.name,
  email: user.email,
  user_id: user.id,
  created_at: user.createdAt,
  user_hash: user.user_hash,
  hide_default_launcher: true,
  alignment: 'right',
})

export const updateActiveIntercomUser = props => {
  const user = intercomProps(props)
  if (typeof window.Intercom === 'function') {
    window.Intercom('update', user)
  }
}
