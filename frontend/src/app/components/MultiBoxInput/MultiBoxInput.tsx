import React from 'react'
import { InputField, theme as uiTheme } from '@project-atl/ui'

import { useMultiBoxInputStyles } from './MultiBoxInput.styles'

interface MultiBoxInputProps {
  numBoxes: number
  boxValues: Array<number | null>
  setBoxValues: (boxValues: Array<number | null>) => void
  submit: () => void
}

interface BoxInputProps {
  index: number
  boxValues: Array<number | null>
  setBoxValues: (boxValues: Array<number | null>) => void
  submit: () => void
  refs: React.MutableRefObject<Array<HTMLInputElement | null>>
}

const setBoxValue = ({
  boxValues,
  index,
  refs,
  setBoxValues,
  submit,
  value,
}) => {
  // If the input value is not numeric, ignore it
  if (value.length > 0 && !/^[0-9]+$/g.test(value)) {
    return
  }

  const boxValue = value[0] ?? null
  const boxValuesCopy = boxValues
  boxValuesCopy[index] = boxValue

  let completed = false
  const currentRef = refs.current[index]
  const nextRef = refs.current[index + 1]
  if (nextRef) {
    if (boxValue) {
      // Focus on it
      nextRef.focus()
      // Then, input the next value in the string if it's not already set
      if (value.length > 1 && !boxValues[index + 1]) {
        setBoxValue({
          boxValues: boxValuesCopy,
          index: index + 1,
          refs,
          setBoxValues,
          submit,
          value: value.slice(1),
        })
      } else {
        completed = true
      }
    }
  } else if (currentRef) {
    completed = true
  }
  if (!boxValue) {
    completed = true
  }

  if (completed) {
    /*
     * Need to spread the values to create a new Array.
     * Otherwise, React will not re-render, because the array address
     * has not actually changed.
     */
    setBoxValues([...boxValuesCopy])
  }
}

const BoxInput: React.FC<BoxInputProps> = ({
  index,
  boxValues,
  setBoxValues,
  submit,
  refs,
}) => {
  const classes = useMultiBoxInputStyles()
  return (
    <InputField
      sx={{
        backgroundColor: uiTheme.palette.neutral[700],
        height: '56px',
      }}
      inputProps={{
        className: classes.BoxInput,
        onKeyDown: event => {
          if (event.code === 'Enter' || event.code === 'NumpadEnter') {
            event.preventDefault()
            const currentRef = refs.current[index]
            if (currentRef) {
              currentRef.blur()
            }
            submit()
          }

          if (event.code === 'Backspace') {
            event.preventDefault()

            // Clear value of current.
            setBoxValue({
              boxValues,
              index,
              refs,
              setBoxValues,
              submit,
              value: '',
            })

            // Focus on prev.
            const prevRef = refs.current[index - 1]
            if (prevRef) {
              prevRef.focus()
            }
          }
        },
        onChange: event => {
          const target = event.target as HTMLTextAreaElement
          const value = target.value

          setBoxValue({
            boxValues,
            index,
            refs,
            setBoxValues,
            submit,
            value,
          })
        },
        ref: el => (refs.current[index] = el),
      }}
      type="number"
      value={boxValues[index] ?? ''}
    />
  )
}

const MultiBoxInput: React.FC<MultiBoxInputProps> = ({
  numBoxes,
  boxValues,
  submit,
  setBoxValues,
}) => {
  const classes = useMultiBoxInputStyles()

  const inputRefs = React.useRef(Array(numBoxes).fill(null))

  React.useEffect(() => {
    const firstRef = inputRefs?.current?.[0]
    if (firstRef) {
      firstRef.focus()
    }
  }, [inputRefs])

  return (
    <div className={classes.MultiBoxInput__container}>
      {Array(numBoxes)
        .fill(0)
        .map((_, index) => (
          <BoxInput
            key={`BoxInput_${index}`}
            index={index}
            boxValues={boxValues}
            setBoxValues={setBoxValues}
            submit={submit}
            refs={inputRefs}
          />
        ))}
    </div>
  )
}

export default MultiBoxInput
