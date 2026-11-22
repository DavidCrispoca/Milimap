import { fireEvent, render, screen } from '@testing-library/react'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { calle100Campus } from '../data'
import { FloorPlanSvg } from './FloorPlanSvg'

describe('FloorPlanSvg room labels', () => {
  beforeAll(() => {
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe(): void {}
        unobserve(): void {}
        disconnect(): void {}
      },
    )
  })

  it('exposes the full room name and opens a readable detail card on tap', () => {
    const floor = calle100Campus.floors.find((candidate) => candidate.level === 1)!
    const room = floor.spaces.find((candidate) => candidate.name.length > 14)!

    render(<FloorPlanSvg floor={floor} />)

    const group = document.querySelector(`[data-space-id="${room.id}"]`)
    expect(group).not.toBeNull()
    expect(group?.querySelector('title')).toHaveTextContent(room.name)
    expect(group?.querySelectorAll('tspan').length).toBeGreaterThan(0)
    expect(screen.queryByText(/…/)).not.toBeInTheDocument()

    fireEvent.click(group!)

    const detail = document.querySelector('.floor-plan-detail__name')
    expect(detail).toHaveTextContent(room.name)
  })

  it('renders the vehicular street with a dashed centre line', () => {
    const floor = calle100Campus.floors.find((candidate) => candidate.level === 1)!

    render(<FloorPlanSvg floor={floor} />)

    const road = document.querySelector('polygon[fill="var(--map-road)"]')
    expect(road).not.toBeNull()
    expect(road?.parentElement?.querySelector('line')).toHaveAttribute('stroke-dasharray', '1.4 1')
  })
})
