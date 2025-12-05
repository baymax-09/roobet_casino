import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { connect } from 'react-redux'

import { Button } from 'mrooi'
import { SoundToggle } from 'app/components'
import { useTranslate, useDialogsOpener } from 'app/hooks'
import { type User } from 'common/types'

import { useGameSettingsStyles } from './GameSettings.styles'

interface GameSettingsProps {
  user: User
  changeSeeds: boolean
  gameName: string
}

const GameSettingsView: React.FC<GameSettingsProps> = ({
  user,
  changeSeeds,
  gameName,
}) => {
  const classes = useGameSettingsStyles()
  const translate = useTranslate()
  const openDialog = useDialogsOpener()

  const handleOnClick = () => {
    openDialog('fairness', {
      params: { gameName },
    })
  }

  return (
    <div className={classes.GameSettings}>
      <div className={classes.GameSettings__buttonContainer}>
        {changeSeeds && (
          <Button type="gameSetting" onClick={handleOnClick}>
            <FontAwesomeIcon icon="balance-scale" />
            {translate('gameSettings.changeSeeds')}
          </Button>
        )}
        {!!user && <SoundToggle systemName="app" />}
      </div>
    </div>
  )
}

const mapStateToProps = (state: { user: User }) => ({
  user: state.user,
})

export const GameSettings = connect(mapStateToProps)(GameSettingsView)
