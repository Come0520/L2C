import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/supabase/client', () => {
  const chain = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    range: vi.fn().mockResolvedValue({ data: [], count: 0, error: null }),
  }
  const client = {
    from: vi.fn(() => chain),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null }),
      signInWithPassword: vi.fn().mockResolvedValue({ data: null, error: null }),
    },
  }
  return {
    createClient: () => client,
    supabase: client,
  }
})

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { installationScheduleService } from '@/services/installation-schedule.client'
import InstallationCalendar from '../installation-calendar'

describe('InstallationCalendar view changes and data fetching', () => {
  it('fetches on mount with initial year/month and refetches on view change', async () => {
    const spy = vi.fn(async () => ([
      { date: `2024-03-01`, totalInstallations: 2, installations: [] },
      { date: `2024-03-08`, totalInstallations: 1, installations: [] },
    ] as any))
    ;(installationScheduleService as any).getInstallationCalendar = spy
    render(
      <InstallationCalendar initialYear={2024} initialMonth={3} initialDay={3} initialView="month" />
    )

    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy).toHaveBeenCalledWith(2024, 3)
    })

    fireEvent.click(screen.getByRole('button', { name: '周视图' }))

    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(2)
      const lastArgs = spy.mock.calls.at(-1)
      expect(lastArgs).toEqual([2024, 3])
    })
  })

  it('navigates prev in week view and refetches with updated month when crossing month', async () => {
    const spy = vi.fn(async () => ([
      { date: `2024-03-01`, totalInstallations: 2, installations: [] },
      { date: `2024-03-08`, totalInstallations: 1, installations: [] },
    ] as any))
    ;(installationScheduleService as any).getInstallationCalendar = spy
    render(
      <InstallationCalendar initialYear={2024} initialMonth={3} initialDay={3} initialView="week" />
    )

    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(1)
      const lastArgs = spy.mock.calls.at(-1)
      expect(lastArgs).toEqual([2024, 3])
    })

    fireEvent.click(screen.getByRole('button', { name: '上一个周期' }))

    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(2)
      const lastArgs = spy.mock.calls.at(-1)
      // 2024-03-03 往前一周到 2024-02-25
      expect(lastArgs).toEqual([2024, 2])
    })
  })

  it('drag and drop success updates schedule and refetches', async () => {
    const getSpy = vi.fn(async () => ([
      { date: `2024-03-03`, totalInstallations: 1, installations: [
        { id: 's1', installationNo: 'INST-001', customerName: '张三', startTime: '09:00', endTime: '10:00' }
      ] },
      { date: `2024-03-04`, totalInstallations: 0, installations: [] },
    ] as any))
    const updateSpy = vi.fn(async () => ({ data: null, error: null }))
    ;(installationScheduleService as any).getInstallationCalendar = getSpy
    ;(installationScheduleService as any).updateInstallationSchedule = updateSpy

    render(
      <InstallationCalendar initialYear={2024} initialMonth={3} initialDay={3} initialView="week" />
    )

    await waitFor(() => {
      expect(getSpy).toHaveBeenCalledTimes(1)
    })

    const scheduleItem = await screen.findByText('09:00 - 张三')
    const dt: any = {
      effectAllowed: 'move',
      setData: vi.fn(),
      getData: vi.fn(() => 's1'),
    }
    fireEvent.dragStart(scheduleItem, { dataTransfer: dt })

    const dayTarget = screen.getByText('4')
    fireEvent.drop(dayTarget, { dataTransfer: dt })

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledTimes(1)
    })
    await waitFor(() => {
      expect(getSpy).toHaveBeenCalledTimes(2)
    })
  })

  it('drag to the same date keeps date and updates once', async () => {
    const getSpy = vi.fn(async () => ([
      { date: `2024-03-03`, totalInstallations: 1, installations: [
        { id: 's3', installationNo: 'INST-003', customerName: '王五', startTime: '13:00', endTime: '14:00' }
      ] },
    ] as any))
    const updateSpy = vi.fn(async () => ({ data: null, error: null }))
    ;(installationScheduleService as any).getInstallationCalendar = getSpy
    ;(installationScheduleService as any).updateInstallationSchedule = updateSpy

    render(
      <InstallationCalendar initialYear={2024} initialMonth={3} initialDay={3} initialView="week" />
    )

    const scheduleItem = await screen.findByText('13:00 - 王五')
    const targetDay = screen.getByText('3')
    const dt: any = { effectAllowed: 'move', setData: vi.fn(), getData: vi.fn(() => 's3') }
    fireEvent.dragStart(scheduleItem, { dataTransfer: dt })
    fireEvent.drop(targetDay, { dataTransfer: dt })

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledTimes(1)
    })
  })

  it('day view renders side info details', async () => {
    const expectedDate = new Date(2024, 3 - 1, 3).toISOString().split('T')[0]
    const getSpy = vi.fn(async () => ([
      { date: expectedDate, totalInstallations: 1, installations: [
        { id: 's4', installationNo: 'INST-004', customerName: '赵六', startTime: '15:00', endTime: '16:00', status: 'completed' }
      ] },
    ] as any))
    ;(installationScheduleService as any).getInstallationCalendar = getSpy

    render(
      <InstallationCalendar initialYear={2024} initialMonth={3} initialDay={3} initialView="day" />
    )

    await screen.findByText('INST-004')
    await screen.findByText('已完成')
    await screen.findByText('赵六')
  })

  it('drag and drop failure shows error message', async () => {
    const getSpy = vi.fn(async () => ([
      { date: `2024-03-03`, totalInstallations: 1, installations: [
        { id: 's2', installationNo: 'INST-002', customerName: '李四', startTime: '10:00', endTime: '11:00' }
      ] },
      { date: `2024-03-04`, totalInstallations: 0, installations: [] },
    ] as any))
    const updateSpy = vi.fn(async () => { throw new Error('failed') })
    ;(installationScheduleService as any).getInstallationCalendar = getSpy
    ;(installationScheduleService as any).updateInstallationSchedule = updateSpy

    render(
      <InstallationCalendar initialYear={2024} initialMonth={3} initialDay={3} initialView="week" />
    )

    const scheduleItem = await screen.findByText('10:00 - 李四')
    const dt: any = {
      effectAllowed: 'move',
      setData: vi.fn(),
      getData: vi.fn(() => 's2'),
    }
    fireEvent.dragStart(scheduleItem, { dataTransfer: dt })
    const dayTarget = screen.getByText('4')
    fireEvent.drop(dayTarget, { dataTransfer: dt })

    const errorEl = await screen.findByText('更新安装调度失败')
    expect(errorEl).toBeInTheDocument()
  })

  it('drag to invalid target date shows error and does not refetch', async () => {
    const getSpy = vi.fn(async () => ([
      { date: `2024-03-03`, totalInstallations: 1, installations: [
        { id: 's5', installationNo: 'INST-005', customerName: '钱七', startTime: '11:00', endTime: '12:00' }
      ] },
      { date: `2024-03-09`, totalInstallations: 0, installations: [] },
    ] as any))
    const updateSpy = vi.fn(async () => { throw new Error('invalid target date') })
    ;(installationScheduleService as any).getInstallationCalendar = getSpy
    ;(installationScheduleService as any).updateInstallationSchedule = updateSpy

    render(
      <InstallationCalendar initialYear={2024} initialMonth={3} initialDay={3} initialView="week" />
    )

    await waitFor(() => {
      expect(getSpy).toHaveBeenCalledTimes(1)
    })

    const scheduleItem = await screen.findByText('11:00 - 钱七')
    const dt: any = {
      effectAllowed: 'move',
      setData: vi.fn(),
      getData: vi.fn(() => 's5'),
    }
    fireEvent.dragStart(scheduleItem, { dataTransfer: dt })

    const dayTarget = screen.getByText('9')
    fireEvent.drop(dayTarget, { dataTransfer: dt })

    const errorEl = await screen.findByText('更新安装调度失败')
    expect(errorEl).toBeInTheDocument()

    await waitFor(() => {
      expect(getSpy).toHaveBeenCalledTimes(1)
    })
  })

  it('handleToday navigates to current date and triggers fetch', async () => {
    const spy = vi.fn(async () => ([
      { date: `2024-03-01`, totalInstallations: 2, installations: [] },
      { date: `2024-03-08`, totalInstallations: 1, installations: [] },
    ] as any))
    ;(installationScheduleService as any).getInstallationCalendar = spy

    render(
      <InstallationCalendar initialYear={2024} initialMonth={3} initialDay={3} initialView="week" />
    )
    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy).toHaveBeenLastCalledWith(2024, 3)
    })

    fireEvent.click(screen.getByRole('button', { name: '今天' }))

    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(2)
      const lastArgs = spy.mock.calls.at(-1) as any
      expect(lastArgs).not.toEqual([2024, 3])
    })
  })
})
