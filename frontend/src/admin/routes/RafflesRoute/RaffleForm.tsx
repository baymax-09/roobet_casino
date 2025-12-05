import React, { useCallback, useEffect } from 'react'
import { useFormik } from 'formik'
import {
  Box,
  Button,
  ButtonBase,
  CircularProgress,
  Divider,
  Grid,
  MenuItem,
  Paper,
  TextField,
  Typography,
} from '@mui/material'
import moment from 'moment'
import ordinal from 'ordinal'
import { Close } from '@mui/icons-material'

import {
  api,
  coerceDateToUTCString,
  invertDateUTCOffset,
  prettyPrintSize,
  uploadImage,
} from 'common/util'
import { RaffleTypes, type Raffle } from 'common/types'
import { useConfirm, useToasts } from 'common/hooks'
import { TitleContainer, DateTimePicker } from 'mrooi'
import { isObjectError } from 'admin/util/error'
import DefaultRaffleBannerPreview from 'app/components/Raffle/templates/default/DefaultRaffleBannerPreview'
import FileSelect from 'admin/components/FileSelect/FileSelect'

import RaffleWinners from './RaffleWinners'
import { RaffleFormModifier } from './RaffleFormModifier'

import { useRaffleFormStyles } from './RaffleForm.styles'

interface RaffleFormProps {
  title: string
  initialValues: Partial<Raffle>
  onSubmit: (values: Partial<Raffle>) => void
  reloadRaffle?: () => void
  edit: boolean
}

const image = {
  bannerImage: {
    maxSize: 500_000,
  },
  featureImage: {
    maxSize: 500_000,
  },
  heroImage: {
    maxSize: 500_000,
  },
}

export const RaffleForm: React.FC<RaffleFormProps> = ({
  title,
  initialValues,
  onSubmit,
  edit,
  reloadRaffle,
}) => {
  const formRef = React.useRef<HTMLFormElement>(null)
  const classes = useRaffleFormStyles()
  const confirm = useConfirm()
  const { toast } = useToasts()

  const [activityIndicator, setActivityIndicator] = React.useState({
    bannerImage: false,
    featureImage: false,
    heroImage: false,
  })

  const initialFormValues: Partial<Raffle> = React.useMemo(
    () => ({
      type: 'default',
      winners: [],
      winnersRevealed: false,
      winnerCount: 1,
      archived: false,
      payouts: [],
      ...initialValues,
      start: initialValues.start
        ? invertDateUTCOffset(initialValues.start)
        : moment().toDate(),
      end: initialValues.end
        ? invertDateUTCOffset(initialValues.end)
        : moment().add(1, 'days').toDate(),
      ticketsPerDollar:
        (initialValues.ticketsPerDollar ?? 0) *
          (initialValues.baseDollarAmount ?? 0) || undefined,
      modifiers: (initialValues.modifiers ?? []).map(mod => ({
        ...mod,
        ticketsPerDollar:
          mod.ticketsPerDollar * (initialValues.baseDollarAmount ?? 0),
      })),
    }),
    [initialValues],
  )

  const isValid = () => {
    if (formRef.current) {
      const isValid = formRef.current.checkValidity()

      if (!isValid) {
        formRef.current.reportValidity()
      }

      return isValid
    }

    return false
  }

  const saveRaffle = () => {
    if (!isValid()) {
      return
    }

    values.start = new Date(coerceDateToUTCString(values.start))
    values.end = new Date(coerceDateToUTCString(values.end))

    if (values.ticketsPerDollar && values.baseDollarAmount) {
      values.ticketsPerDollar =
        values.ticketsPerDollar / values.baseDollarAmount
    }

    values.modifiers = (values.modifiers ?? []).map(mod => ({
      ...mod,
      ticketsPerDollar: mod.ticketsPerDollar / (values.baseDollarAmount ?? 1),
    }))

    onSubmit(values)
  }

  const {
    values,
    errors,
    handleChange,
    handleSubmit,
    setFieldValue,
    setValues,
  } = useFormik({
    onSubmit: saveRaffle,
    initialValues: initialFormValues,
  })

  const archiveRaffle = async () => {
    if (!isValid()) {
      return
    }

    await setFieldValue('archived', !values.archived)
  }

  const revealWinners = async () => {
    if (!isValid()) {
      return
    }

    await setFieldValue('winnersRevealed', true)
  }

  const drawWinners = useCallback(async () => {
    try {
      await confirm({
        title: 'Confirm Action',
        message: 'Are you sure you want to draw winners?',
      })

      await api.post<{ raffle: Raffle }>(`/raffle/${values._id}/drawWinners`)
      toast.success('Winners picked!')
      reloadRaffle?.()
    } catch (error: any) {
      if (error) {
        toast.error(
          isObjectError(error) ? error.message : 'An unknown error occurred.',
        )
      }
    }
  }, [confirm, values._id, toast, reloadRaffle])

  useEffect(() => {
    if (!values.winnerCount || values.winnerCount === 0) {
      return
    }

    if (values.payouts && values.payouts.length > values.winnerCount) {
      setFieldValue('payouts', values.payouts.slice(0, values.winnerCount))
    }
  }, [setFieldValue, values.payouts, values.winnerCount, values.winners])

  useEffect(() => {
    if (edit) {
      setValues(initialFormValues)
    }
  }, [setValues, initialFormValues, edit])

  const handleImageChange = async (identifier: string, file: File) => {
    if (!file) {
      toast.error('No file selected.')
      return
    }

    const { maxSize } = image[identifier]

    if (maxSize && file.size > maxSize) {
      toast.error(
        `The image must be less than or equal to ${prettyPrintSize(maxSize)}.`,
      )
      return
    }

    setActivityIndicator({ ...activityIndicator, [identifier]: true })

    try {
      let url = URL.createObjectURL(file)
      url = await uploadImage(identifier, file)
      setFieldValue(identifier, url)
    } catch (err: any) {
      toast.error(`An error occurred uploading the image: ${err.message}`)
      return
    } finally {
      setActivityIndicator({ ...activityIndicator, [identifier]: false })
    }
  }

  const handlePayoutChange = (index: number, payout: string) => {
    const payouts = [
      ...(values.payouts
        ? values.payouts
        : new Array(values.winnerCount).fill('')),
    ]
    payouts[index] = payout
    setFieldValue('payouts', payouts)
  }

  const addModifier = () => {
    setFieldValue('modifiers', [
      ...(values?.modifiers || []),
      { type: 'gameIdentifier', identifiers: [] },
    ])
  }

  const removeModifier = (index: number) => {
    const modifiers = [...(values?.modifiers || [])]
    modifiers.splice(index, 1)
    setFieldValue('modifiers', modifiers)
  }

  return (
    <TitleContainer
      title={title}
      returnTo={{
        title: 'Raffles',
        link: '/crm/raffles',
      }}
      actions={() => [
        ...(edit && values.winners?.length === 0
          ? [
              {
                value: 'Draw Winners',
                variant: 'contained' as const,
                onClick: drawWinners,
              },
            ]
          : []),
        ...(edit &&
        values.winners?.length &&
        values.winners.length > 0 &&
        !values.winnersRevealed
          ? [
              {
                value: 'Reveal Winners',
                variant: 'contained' as const,
                onClick: revealWinners,
              },
            ]
          : []),
        {
          value: 'Save',
          variant: 'contained' as const,
          onClick: saveRaffle,
        },
        {
          value: values.archived ? 'Unarchive' : 'Archive',
          variant: 'contained' as const,
          onClick: archiveRaffle,
        },
      ]}
    >
      <form
        ref={formRef}
        className={classes.formContainer}
        onSubmit={handleSubmit}
      >
        <Grid container spacing={4}>
          <Grid item sm={12} className={classes.gridItem}>
            <DefaultRaffleBannerPreview
              title={values.name}
              featuredImageSrc={values.featureImage}
              backgroundImageSrc={values.bannerImage}
              winnerCount={values.winnerCount}
              winnersRevealed={values.winnersRevealed}
              start={new Date(coerceDateToUTCString(values.start))}
              end={new Date(coerceDateToUTCString(values.end))}
            />
          </Grid>

          <Grid item sm={6} className={classes.gridItem}>
            <TextField
              variant="standard"
              required
              select
              fullWidth
              name="type"
              type="text"
              value={values.type}
              error={!!errors.type}
              helperText={errors.type}
              onChange={handleChange}
              margin="normal"
              label="Type"
            >
              {RaffleTypes.map(raffleType => (
                <MenuItem key={raffleType} value={raffleType}>
                  {raffleType}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item sm={6} className={classes.gridItem}>
            <TextField
              variant="standard"
              required
              fullWidth
              name="name"
              type="text"
              value={values.name}
              error={!!errors.name}
              helperText={errors.name}
              onChange={handleChange}
              margin="normal"
              label="Name"
            />
          </Grid>

          <Grid item sm={6} className={classes.gridItem}>
            <TextField
              variant="standard"
              required
              fullWidth
              name="slug"
              type="text"
              value={values.slug}
              error={!!errors.slug}
              helperText={errors.slug}
              onChange={handleChange}
              margin="normal"
              label="Slug"
            />
          </Grid>

          <Grid item sm={6} className={classes.gridItem}>
            <TextField
              variant="standard"
              required
              fullWidth
              name="amount"
              type="number"
              value={values.amount}
              error={!!errors.amount}
              helperText={errors.amount}
              onChange={handleChange}
              margin="normal"
              label="Amount"
            />
          </Grid>

          <Grid item sm={6} className={classes.gridItem}>
            <TextField
              variant="standard"
              required
              fullWidth
              name="winnerCount"
              type="number"
              value={values.winnerCount}
              error={!!errors.winnerCount}
              helperText={errors.winnerCount}
              onChange={handleChange}
              margin="normal"
              label="Winner Count"
              inputProps={{
                min: 1,
              }}
            />
          </Grid>

          <Grid item sm={3} className={classes.gridItem}>
            <TextField
              variant="standard"
              required
              fullWidth
              name="ticketsPerDollar"
              type="number"
              inputProps={{ step: 0.01 }}
              value={values.ticketsPerDollar}
              error={!!errors.ticketsPerDollar}
              helperText={errors.ticketsPerDollar}
              onChange={handleChange}
              margin="normal"
              label="Tickets"
            />
          </Grid>

          <Grid item sm={3} className={classes.gridItem}>
            <TextField
              variant="standard"
              required
              fullWidth
              name="baseDollarAmount"
              type="number"
              value={values.baseDollarAmount}
              error={!!errors.baseDollarAmount}
              helperText={errors.baseDollarAmount}
              onChange={handleChange}
              margin="normal"
              label="Per dollar amount"
            />
          </Grid>

          {/* Dates & Times */}
          <Grid item xs={12}>
            <h2>Dates & Times</h2>
            <Divider key="light" />
          </Grid>

          <Grid item sm={12} md={6} className={classes.gridItem}>
            <DateTimePicker
              fullWidth={true}
              name="start"
              label="Start Time"
              value={moment(values.start)}
              onChange={async val =>
                await setFieldValue('start', val?.toDate())
              }
            />
          </Grid>

          <Grid item sm={12} md={6} className={classes.gridItem}>
            <DateTimePicker
              fullWidth={true}
              name="end"
              label="End Time"
              value={moment(values.end)}
              onChange={async val => await setFieldValue('end', val?.toDate())}
            />
          </Grid>

          {/* Images */}
          <Grid item xs={12}>
            <h2>Images</h2>
            <Divider key="light" />
          </Grid>

          <Grid item xs={12} sm={4}>
            <div className={classes.fileSelect}>
              <label>Banner Image *</label>
              <Box display="flex" alignItems="center" style={{ gap: '16px' }}>
                <FileSelect
                  id="raffleBannerImage"
                  required={!values.bannerImage}
                  onFileChange={async (file: File) =>
                    await handleImageChange('bannerImage', file)
                  }
                >
                  {({ handleClick }) => (
                    <Button
                      onClick={handleClick}
                      variant="outlined"
                      style={{ flex: 'none' }}
                    >
                      Select File
                    </Button>
                  )}
                </FileSelect>
                {activityIndicator.bannerImage ? (
                  <CircularProgress size={24} />
                ) : (
                  <Typography variant="caption">
                    {values.bannerImage ?? 'No file selected'}
                  </Typography>
                )}
              </Box>
            </div>
          </Grid>

          <Grid item xs={12} sm={4}>
            <div className={classes.fileSelect}>
              <label>Feature Image *</label>
              <Box display="flex" alignItems="center" style={{ gap: '16px' }}>
                <FileSelect
                  id="raffleFeatureImage"
                  required={!values.featureImage}
                  onFileChange={async (file: File) =>
                    await handleImageChange('featureImage', file)
                  }
                >
                  {({ handleClick }) => (
                    <Button
                      onClick={handleClick}
                      variant="outlined"
                      style={{ flex: 'none' }}
                    >
                      Select File
                    </Button>
                  )}
                </FileSelect>
                {activityIndicator.featureImage ? (
                  <CircularProgress size={24} color="secondary" />
                ) : (
                  <Typography variant="caption">
                    {values.featureImage ?? 'No file selected'}
                  </Typography>
                )}
              </Box>
            </div>
          </Grid>

          <Grid item xs={12} sm={4}>
            <div className={classes.fileSelect}>
              <label>Hero Image *</label>
              <Box display="flex" alignItems="center" style={{ gap: '16px' }}>
                <FileSelect
                  id="raffleHeroImage"
                  required={!values.heroImage}
                  onFileChange={async (file: File) =>
                    await handleImageChange('heroImage', file)
                  }
                >
                  {({ handleClick }) => (
                    <Button
                      onClick={handleClick}
                      variant="outlined"
                      style={{ flex: 'none' }}
                    >
                      Select File
                    </Button>
                  )}
                </FileSelect>
                {activityIndicator.heroImage ? (
                  <CircularProgress size={24} color="secondary" />
                ) : (
                  <Typography variant="caption">
                    {values.heroImage ?? 'No file selected'}
                  </Typography>
                )}
              </Box>
            </div>
          </Grid>

          {/* Modifiers */}
          <Grid item xs={12}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <h2>Modifiers</h2>
              <Button
                color="primary"
                size="small"
                variant="contained"
                onClick={addModifier}
              >
                Add Modifier
              </Button>
            </div>
            <Divider key="light" />
            <div className={classes.modifierContainer}>
              {!values.modifiers?.length && <em>No modifiers applied</em>}
              {values.modifiers?.map((modifier, i) => (
                <Paper key={i} className={classes.modifier}>
                  <ButtonBase onClick={() => removeModifier(i)}>
                    <Close />
                  </ButtonBase>
                  <Grid container spacing={2}>
                    <RaffleFormModifier
                      index={i}
                      modifier={modifier}
                      baseDollarAmount={values.baseDollarAmount}
                      errors={errors}
                      handleChange={handleChange}
                      setFieldValue={setFieldValue}
                    />
                  </Grid>
                </Paper>
              ))}
            </div>
          </Grid>

          {/* Payouts */}
          <Grid item xs={12}>
            <h2>Payouts</h2>
            <Divider key="light" />
          </Grid>

          {new Array(Math.max(values.winnerCount || 1, 1))
            .fill(null)
            .map((_, i) => (
              <Grid item xs={12} key={i}>
                <TextField
                  variant="standard"
                  required
                  fullWidth
                  name={`payout${i + 1}`}
                  type="text"
                  value={values.payouts?.[i] || ''}
                  error={!!errors.winnerCount}
                  helperText={errors.winnerCount}
                  onChange={event => handlePayoutChange(i, event.target.value)}
                  label={`${ordinal(i + 1)} Place`}
                />
              </Grid>
            ))}

          {/* Winners */}
          {edit && (
            <>
              <Grid item xs={12}>
                <h2>Winners</h2>
                <RaffleWinners
                  raffleId={values._id ?? ''}
                  payouts={values.payouts}
                  winners={values.winners ?? []}
                  reloadRaffle={reloadRaffle}
                />
              </Grid>
            </>
          )}
        </Grid>
      </form>
    </TitleContainer>
  )
}
