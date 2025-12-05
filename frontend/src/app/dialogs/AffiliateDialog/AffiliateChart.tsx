import React from 'react'
import clsx from 'clsx'
import Chart from 'chart.js'
import {
  Button,
  IconButton,
  Typography,
  Loading,
  theme as uiTheme,
} from '@project-atl/ui'
import { Refresh } from '@project-atl/ui/assets'

import { createMoment } from 'app/util'
import { useCurrencyFormatter, useTranslate } from 'app/hooks'

import { DAYS } from './constants'

import { useAffiliateChartStyles } from './AffiliateChart.styles'
import { useAffiliateStatStyles } from './AffiliateStat.styles'

interface AffiliateChartProps {
  earningsPerDay: any[]
  loading: boolean
  days: number
  setDays: React.Dispatch<React.SetStateAction<number>>
  onRefresh: () => void
}

export const AffiliateChart: React.FC<AffiliateChartProps> = React.memo(
  ({ earningsPerDay, loading, days, setDays, onRefresh }) => {
    const classes = useAffiliateChartStyles()
    const statClasses = useAffiliateStatStyles({})
    const translate = useTranslate()
    const exchangeAndFormatCurrency = useCurrencyFormatter()
    const canvasRef = React.useRef<HTMLCanvasElement>(null)
    const chartRef = React.useRef<InstanceType<typeof Chart>>()

    React.useEffect(() => {
      const ctx = canvasRef.current?.getContext('2d')

      if (ctx) {
        // Create a linear gradient for the fill beneath the line
        const gradient = ctx.createLinearGradient(0, 0, 0, 200)
        gradient.addColorStop(0, `${uiTheme.palette.primary[500]}80`) // Start color
        gradient.addColorStop(1, `${uiTheme.palette.primary[500]}00`) // End color

        chartRef.current = new Chart(ctx, {
          type: 'line',
          aspectRatio: 1.5,
          data: {
            labels: [],
            datasets: [
              {
                label: 'Earnings',
                data: [],
                backgroundColor: gradient,
                borderColor: uiTheme.palette.primary[500],
                borderWidth: 2,
                pointBorderColor: uiTheme.palette.neutral[800],
                pointBackgroundColor: uiTheme.palette.neutral[500],
                pointRadius: 5,
                pointHoverRadius: 5,
                pointBorderWidth: 2,
                pointHoverBorderColor: uiTheme.palette.neutral[800],
                pointHoverBackgroundColor: uiTheme.palette.common.white,
                pointHoverBorderWidth: 2,
                fill: true,
              },
            ],
          },

          options: {
            legend: {
              display: false,
            },
            tooltips: {
              titleMarginBottom: 6,
              titleFontFamily: uiTheme.typography.fontFamily,
              titleAlign: 'center',
              titleFontSize: 14,
              titleFontWeight: uiTheme.typography.fontWeightBold,
              bodyFontFamily: uiTheme.typography.fontFamily,
              bodyFontSize: 12,
              // @ts-expect-error not sure what this should be
              bodyFontStyle: uiTheme.typography.fontWeightMedium,
              backgroundColor: uiTheme.palette.primary[500],
              displayColors: false,
              xPadding: 12,
              yPadding: 12,
              cornerRadius: 8,
              caretSize: 8,
              callbacks: {
                // Customize body text to show in proper currency format
                label: function (tooltipItem, data) {
                  const datasetLabel = (() => {
                    if (data.datasets && tooltipItem.datasetIndex) {
                      return data.datasets[tooltipItem.datasetIndex].label
                    }
                    return ''
                  })()
                  const value = tooltipItem.yLabel

                  return (
                    datasetLabel +
                    ': ' +
                    exchangeAndFormatCurrency(Number(value), '0,0.00')
                  )
                },
              },
            },
            scales: {
              yAxes: [
                {
                  position: 'right',
                  gridLines: {
                    borderDash: [4, 4],
                    lineWidth: 2,
                    color: uiTheme.palette.neutral[700],
                    drawBorder: false,
                    tickMarkLength: 4,
                    drawTicks: true,
                    zeroLineColor: 'transparent',
                  },

                  ticks: {
                    mirror: true,
                    fontFamily: uiTheme.typography.fontFamily,
                    fontSize: 12,
                    // @ts-expect-error not sure what this should be

                    fontStyle: 700,
                    fontColor: uiTheme.palette.neutral[300],
                    maxTicksLimit: 8,
                    callback: amount =>
                      exchangeAndFormatCurrency(Number(amount), '0,0.00'),
                  },
                },
              ],
              xAxes: [
                {
                  gridLines: {
                    display: false,
                    drawBorder: false,
                  },

                  ticks: {
                    fontFamily: uiTheme.typography.fontFamily,
                    // @ts-expect-error not sure what this should be
                    fontStyle: 900,
                    fontColor: uiTheme.palette.neutral[300],
                  },
                },
              ],
            },
            layout: {
              padding: 0,
            },
          },
        })
      }

      return () => {
        chartRef.current?.destroy()
      }
    }, [])

    React.useEffect(() => {
      if (loading) {
        return
      }

      if (chartRef.current) {
        chartRef.current.data.labels = earningsPerDay.map(date =>
          createMoment(date.time).format('MMM DD'),
        )

        if (chartRef.current.data.datasets) {
          chartRef.current.data.datasets[0].data = earningsPerDay.map(
            date => date.sum,
          )
        }

        chartRef.current.update()
      }
    }, [loading, earningsPerDay])

    return (
      <div className={statClasses.AffiliateStat}>
        <div
          className={clsx(
            statClasses.AffiliateStatBlock,
            classes.AffiliateBlock__chart,
          )}
        >
          <div className={classes.AffiliateChart}>
            {loading && (
              <Loading className={classes.Loader} widthAndHeight={33} />
            )}
            <div className={classes.AffiliateChartHeader}>
              <Typography
                variant="body2"
                fontWeight={uiTheme.typography.fontWeightBold}
                color={uiTheme.palette.neutral[300]}
              >
                {translate('affiliateChart.referralEarnings')}
              </Typography>
              <div className={classes.DaysContainer}>
                <IconButton
                  size="small"
                  color="tertiary"
                  disabled={loading}
                  className={classes.ChartButtons}
                  onClick={onRefresh}
                >
                  <Refresh width={20} height={20} />
                </IconButton>
                {DAYS.map(day => (
                  <Button
                    key={day}
                    size="small"
                    variant="contained"
                    color="tertiary"
                    disabled={loading}
                    onClick={() => setDays(day)}
                    className={clsx(classes.DaysButton, classes.ChartButtons, {
                      [classes.DaysButton_selected]: day === days,
                    })}
                    buttonTextProps={{ className: classes.DaysButton_text }}
                    label={translate('affiliateChart.day', { day })}
                  />
                ))}
              </div>
            </div>
            <canvas ref={canvasRef} height={226} />
          </div>
        </div>
      </div>
    )
  },
)

AffiliateChart.displayName = 'AffiliateChart'
