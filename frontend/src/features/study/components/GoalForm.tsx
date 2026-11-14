import { zodResolver } from '@hookform/resolvers/zod'
import {
  Alert, Box, Button, Card, FormControl, FormControlLabel, FormHelperText, FormLabel, MenuItem, Radio, RadioGroup,
  Stack, TextField, ToggleButton, ToggleButtonGroup, Typography,
} from '@mui/material'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { ApiError } from '@/lib/http/api-error'
import { formatNumber, parseDecimal } from '@/lib/format'
import { electives, purposes, requiredSubjects, subjectName, weekdays } from '../model/catalog'
import {
  getWeeklyHoursEstimate, goalFormSchema, initialGoal, toFormField, toFormValues, toGoalInput, type GoalFormValues,
} from '../model/goal-form'
import { useSaveGoal } from '../hooks/useStudy'
import type { Goal, StudyGoalData } from '../model/types'

interface Props {
  savedGoal: Goal | null
  onSaved: (data: StudyGoalData) => void
}

export function GoalForm({ savedGoal, onSaved }: Props) {
  const save = useSaveGoal()
  const form = useForm<GoalFormValues>({
    resolver: zodResolver(goalFormSchema),
    defaultValues: toFormValues(savedGoal ?? initialGoal),
    mode: 'onTouched',
  })
  const { control, register, setValue, getValues, formState: { errors } } = form
  const values = useWatch({ control }) as GoalFormValues
  const electiveCodes = values.electiveCodes ?? []
  const codes = [...requiredSubjects, ...electiveCodes]

  const dailyMinutes = Math.round(parseDecimal(values.dailyHours ?? '') * 60)
  const days = values.days ?? []
  const weeklyHours = dailyMinutes >= 1 ? (dailyMinutes * days.length) / 60 : null
  const estimate = getWeeklyHoursEstimate({
    purpose: (values.purpose ?? 'graduation') as Goal['purpose'], electiveCodes: electiveCodes as Goal['electiveCodes'],
    months: Number(values.months), scores: Object.fromEntries(codes.map((c) => [c, parseDecimal(values.scores?.[c] ?? '')])),
  })
  const isShort = weeklyHours !== null && days.length > 0 && estimate !== null && weeklyHours < estimate
  const suggested = isShort && estimate ? Math.ceil((estimate / days.length) * 10) / 10 : null

  const submit = form.handleSubmit((formValues) => {
    save.mutate(toGoalInput(formValues), {
      onSuccess: onSaved,
      onError: (error) => {
        if (!(error instanceof ApiError)) return
        for (const [field, message] of Object.entries(error.fieldErrors)) {
          form.setError(toFormField(field) as never, { message })
        }
      },
    })
  })

  const scoreError = (code: string) => (errors.scores as Record<string, { message?: string }> | undefined)?.[code]?.message
  const electivesError = errors.electiveCodes?.message ?? errors.electiveCodes?.root?.message
  const saving = save.isPending

  return (
    <Box component="form" noValidate onSubmit={submit} sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, alignItems: 'start' }}>
      <Card sx={{ p: 3 }}>
        <Stack spacing={4} component="fieldset" disabled={saving} sx={{ border: 0, p: 0, m: 0, minWidth: 0 }}>
          <FormControl error={!!errors.purpose}>
            <FormLabel sx={{ fontWeight: 600, color: 'text.primary', mb: 1 }}>01 · Bạn ôn thi để làm gì?</FormLabel>
            <Controller control={control} name="purpose" render={({ field }) => (
              <RadioGroup row {...field}>
                {purposes.map(({ code, label }) => <FormControlLabel key={code} value={code} control={<Radio />} label={label} />)}
              </RadioGroup>
            )} />
            <FormHelperText>{errors.purpose?.message}</FormHelperText>
          </FormControl>

          <Stack spacing={1.5}>
            <Typography sx={{ fontWeight: 600 }}>02 · Môn thi &amp; điểm mục tiêu</Typography>
            <Typography variant="body2" color="text.secondary">Toán và Ngữ văn là bắt buộc. Chọn thêm 2 môn tự chọn.</Typography>
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
              {[0, 1].map((index) => (
                <Controller key={index} control={control} name={`electiveCodes.${index}` as 'electiveCodes.0'} render={({ field }) => (
                  <TextField
                    select label={`Môn tự chọn ${index + 1}`} error={!!electivesError} {...field}
                    onChange={(event) => {
                      field.onChange(event)
                      const code = event.target.value
                      if (!getValues(`scores.${code}`)) setValue(`scores.${code}`, '8,0')
                      void form.trigger('electiveCodes')
                    }}
                  >
                    {electives.map((code) => (
                      <MenuItem key={code} value={code} disabled={electiveCodes[1 - index] === code}>{subjectName(code)}</MenuItem>
                    ))}
                  </TextField>
                )} />
              ))}
            </Box>
            {electivesError && <FormHelperText error>{electivesError}</FormHelperText>}
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
              {codes.map((code) => (
                <TextField
                  key={code} label={`Điểm ${subjectName(code)}`} error={!!scoreError(code)} helperText={scoreError(code)}
                  slotProps={{ htmlInput: { inputMode: 'decimal', maxLength: 8 }, input: { endAdornment: <Typography variant="caption">điểm</Typography> } }}
                  {...register(`scores.${code}`)}
                />
              ))}
            </Box>
          </Stack>

          <Stack spacing={1.5}>
            <Typography sx={{ fontWeight: 600 }}>03 · Thời gian bạn có</Typography>
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
              <TextField
                label="Số tháng còn lại" error={!!errors.months} helperText={errors.months?.message}
                slotProps={{ htmlInput: { inputMode: 'numeric', maxLength: 8 }, input: { endAdornment: <Typography variant="caption">tháng</Typography> } }}
                {...register('months')}
              />
              <TextField
                label="Giờ học mỗi ngày" error={!!errors.dailyHours} helperText={errors.dailyHours?.message}
                slotProps={{ htmlInput: { inputMode: 'decimal', maxLength: 8 }, input: { endAdornment: <Typography variant="caption">giờ</Typography> } }}
                {...register('dailyHours')}
              />
            </Box>
            <FormControl error={!!errors.days}>
              <FormLabel id="goal-day-label" sx={{ mb: 1 }}>Ngày có thể học trong tuần</FormLabel>
              <Controller control={control} name="days" render={({ field }) => (
                <ToggleButtonGroup
                  aria-labelledby="goal-day-label" value={field.value} color="primary" sx={{ flexWrap: 'wrap', gap: 0.5 }}
                  onChange={(_, next: number[]) => field.onChange(next)}
                >
                  {weekdays.map(({ short, label }, index) => (
                    <ToggleButton key={short} value={index + 1} aria-label={label} sx={{ borderRadius: '999px !important', px: 2 }}>{short}</ToggleButton>
                  ))}
                </ToggleButtonGroup>
              )} />
              <FormHelperText>{errors.days?.message ?? errors.days?.root?.message}</FormHelperText>
            </FormControl>
          </Stack>
          <Typography variant="caption" color="text.secondary">Có thể thay đổi mục tiêu bất cứ lúc nào.</Typography>
        </Stack>
      </Card>

      <Card component="aside" aria-labelledby="goal-summary-title" sx={{ p: 3, position: { md: 'sticky' }, top: 88 }}>
        <Stack spacing={2}>
          <Typography id="goal-summary-title" variant="overline" color="primary" sx={{ fontWeight: 600 }}>Thời gian mỗi tuần</Typography>
          <Box aria-live="polite">
            <Typography variant="h1" component="p">{weeklyHours === null ? '—' : `${formatNumber(weeklyHours)} giờ`}</Typography>
            <Typography variant="body2" color="text.secondary">
              {weeklyHours === null ? 'Nhập số giờ học mỗi ngày để tính.' : `${formatNumber(dailyMinutes / 60)} giờ × ${days.length} ngày học`}
            </Typography>
          </Box>
          {isShort && suggested !== null && (
            <Alert severity="warning">
              <strong>Quỹ giờ còn hơi thấp.</strong> Với mục tiêu hiện tại, bạn nên dành khoảng {estimate} giờ/tuần. Hãy tăng lên {formatNumber(suggested)} giờ/ngày hoặc điều chỉnh điểm mục tiêu.
            </Alert>
          )}
          <Typography variant="body2" color="text.secondary">Lộ trình sẽ ưu tiên phần kiến thức cần thiết và phân bổ theo lịch rảnh của bạn.</Typography>
          <Button type="submit" variant="contained" size="large" disabled={saving}>
            {saving ? 'Đang lưu và tạo lộ trình…' : 'Lưu và tạo lộ trình'}
          </Button>
          {save.isError && !Object.keys((save.error as ApiError).fieldErrors ?? {}).length && (
            <Alert severity="error" role="alert">{save.error.message}</Alert>
          )}
          {Object.keys(errors).length > 0 && <Alert severity="error" role="alert">Kiểm tra lại các trường được đánh dấu.</Alert>}
        </Stack>
      </Card>
    </Box>
  )
}
