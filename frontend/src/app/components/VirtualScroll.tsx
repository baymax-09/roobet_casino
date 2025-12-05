import React from 'react'

interface VirtualScrollProps {
  scrollContainerHeight: number
  totalNumberOfRows: number
  rows: any[]
  /** assumed to remain fixed */
  rowHeight: number
  rowRenderer: (
    rowStyles: any,
    fromRow: number,
    toRow: number,
    parentStyles: any,
  ) => JSX.Element
}

interface VirtualScrollState {
  startRowsFrom: number
  endRowsTo: number
  scrollPos: number
}

/**
 * @note Do not attempt to convert me to a functional component: when Roulette is updated, I will be deleted.
 */
export class VirtualScroll extends React.Component<
  VirtualScrollProps,
  VirtualScrollState
> {
  constructor(props) {
    super(props)
    this.state = {
      startRowsFrom: 0,
      endRowsTo: 0,
      scrollPos: 0,
    }
  }

  override UNSAFE_componentWillMount() {
    this.updateContent(this.state.scrollPos || 0)
  }

  override UNSAFE_componentWillReceiveProps(newProps) {
    this.updateContent(this.state.scrollPos || 0, newProps)
  }

  override render() {
    const { totalNumberOfRows, scrollContainerHeight, rowHeight, rowRenderer } =
      this.props
    const totalRowHeight = totalNumberOfRows * rowHeight
    const activateVirtualScroll = totalRowHeight > scrollContainerHeight

    // Finding out maximum height of the container-
    let virtualScrollHeight =
      scrollContainerHeight > window.innerHeight
        ? window.innerHeight
        : scrollContainerHeight
    virtualScrollHeight =
      totalRowHeight < virtualScrollHeight
        ? totalRowHeight
        : virtualScrollHeight

    return (
      <div style={{ height: `${virtualScrollHeight}px`, overflowY: 'auto' }}>
        {activateVirtualScroll
          ? rowRenderer(
              {
                transform: `translateY(${
                  this.state.startRowsFrom * rowHeight
                }px)`,
                height: `${rowHeight}px`,
              },
              this.state.startRowsFrom,
              this.state.endRowsTo,
              { height: `${totalRowHeight}px` },
            )
          : rowRenderer(
              { transform: 'translateY(0px)', height: `${rowHeight}px` },
              0,
              totalNumberOfRows,
              { height: `${totalRowHeight}px` },
            )}
      </div>
    )
  }

  updateContent(yPos: number, newProps?: VirtualScrollProps) {
    const props = newProps || this.props
    const virtualScrollContainerHeight =
      props.scrollContainerHeight > window.innerHeight
        ? window.innerHeight
        : props.scrollContainerHeight

    const alreadyScrolledRows = Math.floor(yPos / props.rowHeight)
    const rowsThatCanBeShownInVisibleArea = Math.ceil(
      virtualScrollContainerHeight / props.rowHeight,
    )
    const startRowsFrom = Math.max(0, alreadyScrolledRows)
    const endRowsTo = alreadyScrolledRows + rowsThatCanBeShownInVisibleArea

    this.setState({
      startRowsFrom,
      endRowsTo,
      scrollPos: yPos,
    })
  }

  scrollHook($el) {
    this.updateContent($el.scrollTop)
  }
}
