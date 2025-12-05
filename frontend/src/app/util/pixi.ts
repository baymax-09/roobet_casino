// eslint-disable-next-line id-length
export function drawDashedGraphicsLine(g, toX, toY, dash = 16, gap = 8) {
  const lastPosition = g.currentPath.points

  const currentPosition = {
    x: lastPosition[lastPosition.length - 2] || 0,
    y: lastPosition[lastPosition.length - 1] || 0,
  }

  const absValues = {
    toX: Math.abs(toX),
    toY: Math.abs(toY),
  }

  for (
    ;
    Math.abs(currentPosition.x) < absValues.toX ||
    Math.abs(currentPosition.y) < absValues.toY;

  ) {
    currentPosition.x =
      Math.abs(currentPosition.x + dash) < absValues.toX
        ? currentPosition.x + dash
        : toX
    currentPosition.y =
      Math.abs(currentPosition.y + dash) < absValues.toY
        ? currentPosition.y + dash
        : toY

    g.lineTo(currentPosition.x, currentPosition.y)

    currentPosition.x =
      Math.abs(currentPosition.x + gap) < absValues.toX
        ? currentPosition.x + gap
        : toX
    currentPosition.y =
      Math.abs(currentPosition.y + gap) < absValues.toY
        ? currentPosition.y + gap
        : toY

    g.moveTo(currentPosition.x, currentPosition.y)
  }
}
