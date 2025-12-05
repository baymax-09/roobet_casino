import React from 'react'
import clsx from 'clsx'
import numeral from 'numeral'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import ReactTooltip from 'react-tooltip'
import withStyles from '@mui/styles/withStyles'

import { textFieldStyles } from './TextField.styles'

class TextFieldComponent extends React.PureComponent<any> {
  static defaultProps = {
    variant: 'text',
    readOnly: false,
    label: true,
    light: false,
    placeholder: null,
    prefixComponent: null,
    suffixComponent: null,
    prefix: null,
    suffix: null,
    centered: false,
    format: null,
    maxAmount: null,
    minAmount: null,
    autoFocusEnabled: false,
    classes: {
      controlContainer: null,
    },

    onFocus: null,
    onBlur: null,
  }

  _previousValue: any

  override componentDidMount() {
    const { autoFocusEnabled } = this.props
    this._updateFormat()
    if (autoFocusEnabled && this.refs.input) {
      setTimeout(() => {
        try {
          ;(this.refs.input as HTMLInputElement).focus()
        } catch (err) {}
      }, 100)
    }
  }

  _updateFormat() {
    const { variant, format, value, maxAmount, minAmount } = this.props
    //
    // if (!value || Number.isNaN(value)) {
    //   return
    // }

    let currentValue = value || 0

    if (variant === 'decimal') {
      if (minAmount !== null && parseFloat(currentValue) < minAmount) {
        currentValue = minAmount
      }

      if (maxAmount !== null && parseFloat(currentValue) > maxAmount) {
        currentValue = this._previousValue || maxAmount
      }

      if (!(typeof value === 'undefined' || Number.isNaN(value))) {
        if (format !== null) {
          currentValue = numeral(currentValue).format(format)
        }
      }

      if (currentValue !== this.props.value) {
        this.props.onChange(currentValue)
      }
    }
  }

  _onChange = event => {
    if (this.props.onChange) {
      this.props.onChange(event.target.value)
    }
  }

  _onKeyPress = event => {
    const charCode = event.which ? event.which : event.keyCode
    const { variant } = this.props

    if (variant === 'decimal') {
      if (
        charCode !== 46 &&
        charCode > 31 &&
        (charCode < 48 || charCode > 57)
      ) {
        event.preventDefault()
      }
    }
  }

  _onKeyDown = event => {
    const { onKeyDown } = this.props

    if (onKeyDown && event.key === 'Enter') {
      event.preventDefault()
      onKeyDown(event)
    }
  }

  _onBlur = () => {
    this._updateFormat()

    if (this.props.onBlur) {
      this.props.onBlur()
    }
  }

  _onFocus = () => {
    this._previousValue = this.props.value
    if (this.props.onFocus) {
      this.props.onFocus()
    }
  }

  _onClick = event => {
    if (this.props.disabled) {
      return
    }

    if (this.props.onClick) {
      this.props.onClick(event)
    }
  }

  override render() {
    const {
      label,
      placeholder,
      readOnly,
      inputProps,
      classes,
      disabled,
      info,
      light,
      centered,
      className,
    } = this.props
    const cl = clsx(classes.textField, className, {
      [classes.disabled]: disabled,
      [classes.readOnly]: readOnly,
      [classes.centered]: centered,
      [classes.light]: light,
    })

    return (
      <div className={cl} onClick={this._onClick}>
        <ReactTooltip
          className={clsx('tooltip')}
          effect="solid"
          type={light ? 'dark' : 'light'}
          place="right"
          id="textField"
        />
        {label && (
          <label className={classes.label}>
            {label}
            {info && (
              <FontAwesomeIcon
                data-for="textField"
                data-tip={info}
                className={classes.info}
                icon={['fas', 'info-circle']}
              />
            )}
          </label>
        )}

        <div
          className={clsx(classes.controlContainer, classes.controlContainer)}
        >
          {this.props.prefixComponent}

          {this.props.prefix && (
            <div className={classes.prefix}>{this.props.prefix}</div>
          )}

          <input
            ref="input"
            disabled={disabled}
            className={clsx(classes.inputControl)}
            autoComplete="off"
            autoFocus={this.props.autoFocus}
            readOnly={readOnly}
            value={this.props.value}
            placeholder={placeholder || label}
            onChange={this._onChange}
            onKeyPress={this._onKeyPress}
            onKeyDown={event => this._onKeyDown(event)}
            onBlur={this._onBlur}
            onFocus={this._onFocus}
            {...inputProps}
          />

          {this.props.suffix && (
            <div className={classes.suffix}>{this.props.suffix}</div>
          )}

          {this.props.suffixComponent}
        </div>
      </div>
    )
  }
}

export const TextField = withStyles(textFieldStyles)(TextFieldComponent)
