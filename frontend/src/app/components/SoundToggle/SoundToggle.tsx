import React from 'react'
import { connect } from 'react-redux'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import { Button } from 'mrooi'
import { changeSetting } from 'app/lib/user'
import { changeVolume } from 'app/lib/sound'
import { useTranslate } from 'app/hooks'
import { type User } from 'common/types'
import { useToasts } from 'common/hooks'

interface SoundToggleProps {
  user: User
  systemName: string
}

const SoundToggleView: React.FC<SoundToggleProps> = ({ user, systemName }) => {
  const currentVolume = user && user.systemSettings?.[systemName].volume
  const translate = useTranslate()
  const { toast } = useToasts()
  const _changeVolume = React.useCallback(
    newVolume => {
      newVolume = parseFloat(newVolume)

      try {
        changeSetting(systemName, 'volume', newVolume)
        changeVolume(systemName, newVolume)
      } catch (err) {
        if (typeof err === 'string') {
          toast.error(err)
        } else {
          toast.error(translate('generic.error'))
        }
      }
    },
    [systemName],
  )

  const icons = {
    app: (
      <FontAwesomeIcon
        icon={['far', currentVolume ? 'volume-up' : 'volume-off']}
      />
    ),
    music: <FontAwesomeIcon icon="music" />,
  }

  return (
    <Button
      type="gameSetting"
      onClick={() => {
        _changeVolume(currentVolume ? 0 : 1)
      }}
    >
      {icons[systemName]}
      {translate('soundToggle.sound')}{' '}
      {currentVolume === 0
        ? translate('soundToggle.off')
        : translate('soundToggle.on')}
    </Button>
  )
}

const mapStateToProps = (state: { user: User }) => ({
  user: state.user,
})

export const SoundToggle = connect(mapStateToProps)(React.memo(SoundToggleView))
