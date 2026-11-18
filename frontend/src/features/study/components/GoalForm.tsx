import { zodResolver } from '@hookform/resolvers/zod'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked'
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked'
import {
  Alert,
  Box,
  Button,
  Card,
  FormHelperText,
  MenuItem,
  Select,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { colors } from '@/app/theme/theme'
import { formatNumber, parseDecimal } from '@/lib/format'
import { ApiError } from '@/lib/http/api-error'
import { FieldBox } from '@/shared/components/FieldBox'
import { Kicker } from '@/shared/components/PageHeader'
import { Notice } from '@/shared/components/Notice'
import { useSaveGoal } from '../hooks/useStudy'
import { electives, purposes, requiredSubjects, subjectName, weekdays } from '../model/catalog'
import {
  getWeeklyHoursEstimate,
  goalFormSchema,
  initialGoal,
  toFormField,
  toFormValues,
  toGoalInput,
  type GoalFormValues,
} from '../model/goal-form'
import type { Goal, StudyGoalData } from '../model/types'

interface Props {
  savedGoal: Goal | null
  onSaved: (data: StudyGoalData) => void
}

function SectionTitle({ index, children }: { index: string; children: string }) {
  return (
    <Typography component="legend" variant="h2" sx={{ fontWeight: 600, mb: 2 }}>
      <Box component="span" sx={{ color: 'text.secondary', fontWeight: 500, mr: 1.5 }}>
        {index}
      </Box>
      {children}
    </Typography>
  )
}

export function GoalForm({ savedGoal, onSaved }: Props) {
  const save = useSaveGoal()
  const form = useForm<GoalFormValues>({
    resolver: zodResolver(goalFormSchema),
    defaultValues: toFormValues(savedGoal ?? initialGoal),
    mode: 'onTouched',
  })
  const {
    control,
    register,
    setValue,
    getValues,
    formState: { errors },
  } = form
  /** Chuyển kết quả register() của react-hook-form sang props của InputBase (ref -> inputRef). */
  const bind = (name: Parameters<typeof register>[0]) => {
    const { ref, ...rest } = register(name)
    return { ...rest, inputRef: ref }
  }
  const values = useWatch({ control }) as GoalFormValues
  const electiveCodes = values.electiveCodes ?? []
  const codes = [...requiredSubjects, ...electiveCodes]

  const dailyMinutes = Math.round(parseDecimal(values.dailyHours ?? '') * 60)
  const days = values.days ?? []
  const weeklyHours = dailyMinutes >= 1 ? (dailyMinutes * days.length) / 60 : null
  const estimate = getWeeklyHoursEstimate({
    purpose: (values.purpose ?? 'graduation') as Goal['purpose'],
    electiveCodes: electiveCodes as Goal['electiveCodes'],
    months: Number(values.months),
    scores: Object.fromEntries(codes.map((c) => [c, parseDecimal(values.scores?.[c] ?? '')])),
  })
  const isShort = weeklyHours !== null && days.length > 0 && estimate !== null && weeklyHours < estimate
  const suggested = isShort && estimate ? Math.ceil((estimate / days.length) * 10) / 10 : null

  const submit = form.handleSubmit((formValues) => {
    save.mutate(toGoalInput(formValues), {
      onSuccess: onSaved,
      onError: (error) => {
        if (!(error instanceof ApiError)) return
        for (const [field, message] of Object.entries(error.fieldErrors))
          form.setError(toFormField(field) as never, { message })
      },
    })
  })

  const scoreError = (code: string) =>
    (errors.scores as Record<string, { message?: string }> | undefined)?.[code]?.message
  const currentScoreError = (code: string) =>
    (errors.currentScores as Record<string, { message?: string }> | undefined)?.[code]?.message
  const electivesError = errors.electiveCodes?.message ?? errors.electiveCodes?.root?.message
  const saving = save.isPending
  const hasFieldErrors = Object.keys(errors).length > 0

  return (
    <Box
      component="form"
      noValidate
      onSubmit={submit}
      sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, alignItems: 'start' }}
    >
      <Card sx={{ p: { xs: 2.5, md: 4 } }}>
        <Stack spacing={5} component="fieldset" disabled={saving} sx={{ border: 0, p: 0, m: 0, minWidth: 0 }}>
          <Box component="fieldset" sx={{ border: 0, p: 0, m: 0 }}>
            <SectionTitle index="01">Bạn ôn thi để làm gì?</SectionTitle>
            <Controller
              control={control}
              name="purpose"
              render={({ field }) => (
                <Box
                  role="radiogroup"
                  aria-label="Mục đích ôn thi"
                  sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}
                >
                  {purposes.map(({ code, label }) => {
                    const selected = field.value === code
                    return (
                      <Button
                        key={code}
                        role="radio"
                        aria-checked={selected}
                        variant="outlined"
                        onClick={() => field.onChange(code)}
                        startIcon={
                          selected ? (
                            <RadioButtonCheckedIcon />
                          ) : (
                            <RadioButtonUncheckedIcon sx={{ opacity: 0 }} />
                          )
                        }
                        sx={{
                          borderRadius: 2.5,
                          borderColor: selected ? 'primary.main' : colors.border,
                          bgcolor: selected ? colors.lavender : '#fff',
                          color: selected ? 'primary.main' : 'text.primary',
                          fontWeight: 500,
                          px: 2.25,
                          py: 1.25,
                          ...(!selected && { '& .MuiButton-startIcon': { display: 'none' } }),
                        }}
                      >
                        {label}
                      </Button>
                    )
                  })}
                </Box>
              )}
            />
            {errors.purpose && <FormHelperText error>{errors.purpose.message}</FormHelperText>}
          </Box>

          <Box component="fieldset" sx={{ border: 0, p: 0, m: 0 }}>
            <SectionTitle index="02">Môn thi &amp; điểm mục tiêu</SectionTitle>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Toán và Ngữ văn là bắt buộc. Chọn thêm 2 môn tự chọn.
            </Typography>
            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 2 }}>
              {[0, 1].map((index) => (
                <Controller
                  key={index}
                  control={control}
                  name={`electiveCodes.${index}` as 'electiveCodes.0'}
                  render={({ field }) => (
                    <Select
                      size="small"
                      value={field.value}
                      inputProps={{ 'aria-label': `Môn tự chọn ${index + 1}` }}
                      IconComponent={KeyboardArrowDownIcon}
                      error={!!electivesError}
                      sx={{
                        minWidth: 140,
                        borderRadius: 2.5,
                        fontWeight: 500,
                        '& fieldset': { borderColor: colors.border },
                      }}
                      onChange={(event) => {
                        field.onChange(event)
                        const code = String(event.target.value)
                        if (!getValues(`scores.${code}`)) setValue(`scores.${code}`, '8,0')
                        void form.trigger('electiveCodes')
                      }}
                    >
                      {electives.map((code) => (
                        <MenuItem key={code} value={code} disabled={electiveCodes[1 - index] === code}>
                          {subjectName(code)}
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                />
              ))}
            </Box>
            {electivesError && (
              <FormHelperText error sx={{ mb: 1 }}>
                {electivesError}
              </FormHelperText>
            )}
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
              {codes.map((code) => (
                <FieldBox
                  key={code}
                  id={`goal-${code}`}
                  label={subjectName(code)}
                  unit="điểm"
                  error={scoreError(code)}
                  inputProps={{ inputMode: 'decimal', maxLength: 8 }}
                  {...bind(`scores.${code}`)}
                />
              ))}
            </Box>
            <Typography sx={{ fontWeight: 600, mt: 3, mb: 0.5 }}>Điểm hiện tại của bạn (không bắt buộc)</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              Nhập điểm bài kiểm tra gần nhất. Môn càng cách xa mục tiêu càng được xếp nhiều thời gian hơn; với mục tiêu
              chỉ cần tốt nghiệp, môn dưới 5 điểm được ưu tiên thêm.
            </Typography>
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
              {codes.map((code) => (
                <FieldBox
                  key={`current-${code}`}
                  id={`goal-current-${code}`}
                  label={`${subjectName(code)} hiện tại`}
                  unit="điểm"
                  error={currentScoreError(code)}
                  inputProps={{ inputMode: 'decimal', maxLength: 8 }}
                  {...bind(`currentScores.${code}`)}
                />
              ))}
            </Box>
          </Box>

          <Box component="fieldset" sx={{ border: 0, p: 0, m: 0 }}>
            <SectionTitle index="03">Thời gian bạn có</SectionTitle>
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, mb: 3 }}>
              <FieldBox
                id="goal-months"
                label="Số tháng còn lại"
                unit="tháng"
                error={errors.months?.message}
                inputProps={{ inputMode: 'numeric', maxLength: 8 }}
                {...bind('months')}
              />
              <FieldBox
                id="goal-dailyMinutes"
                label="Giờ học mỗi ngày"
                unit="giờ"
                error={errors.dailyHours?.message}
                inputProps={{ inputMode: 'decimal', maxLength: 8 }}
                {...bind('dailyHours')}
              />
            </Box>
            <Typography id="goal-day-label" variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              Ngày có thể học trong tuần
            </Typography>
            <Controller
              control={control}
              name="days"
              render={({ field }) => (
                <ToggleButtonGroup
                  aria-labelledby="goal-day-label"
                  value={field.value}
                  onChange={(_, next: number[]) => field.onChange(next)}
                  sx={{ gap: 1, flexWrap: 'wrap' }}
                >
                  {weekdays.map(({ short, label }, index) => (
                    <ToggleButton
                      key={short}
                      value={index + 1}
                      aria-label={label}
                      sx={{
                        border: 0,
                        borderRadius: '10px !important',
                        width: 48,
                        height: 40,
                        fontWeight: 600,
                        bgcolor: colors.tile,
                        color: 'text.secondary',
                        '&.Mui-selected': { bgcolor: colors.lavender, color: 'primary.main' },
                        '&.Mui-selected:hover': { bgcolor: '#e3dbf6' },
                      }}
                    >
                      {short}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              )}
            />
            {errors.days && (
              <FormHelperText error>{errors.days.message ?? errors.days.root?.message}</FormHelperText>
            )}
          </Box>
          <Typography variant="caption" color="text.secondary">
            Có thể thay đổi mục tiêu bất cứ lúc nào.
          </Typography>
        </Stack>
      </Card>

      <Card
        component="aside"
        aria-labelledby="goal-summary-title"
        sx={{ p: 3.5, position: { md: 'sticky' }, top: 24 }}
      >
        <Stack spacing={2.5}>
          <Kicker>
            <span id="goal-summary-title">Thời gian mỗi tuần</span>
          </Kicker>
          <Box aria-live="polite">
            <Typography variant="h1" component="p" color="primary" sx={{ fontSize: '2.6rem' }}>
              {weeklyHours === null ? '—' : `${formatNumber(weeklyHours)} giờ`}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
              {weeklyHours === null
                ? 'Nhập số giờ học mỗi ngày để tính.'
                : `${formatNumber(dailyMinutes / 60)} giờ × ${days.length} ngày học`}
            </Typography>
          </Box>
          {isShort && suggested !== null && (
            <Notice tone="warning" title="Quỹ giờ còn hơi thấp">
              Với mục tiêu hiện tại, bạn nên dành khoảng {estimate} giờ/tuần. Hãy tăng lên{' '}
              {formatNumber(suggested)} giờ/ngày hoặc điều chỉnh điểm mục tiêu.
            </Notice>
          )}
          <Typography variant="body2" color="text.secondary">
            Lộ trình sẽ ưu tiên phần kiến thức cần thiết và phân bổ theo lịch rảnh của bạn.
          </Typography>
          <Button type="submit" variant="contained" size="large" disabled={saving} sx={{ py: 1.5 }}>
            {saving ? 'Đang lưu và tạo lộ trình…' : 'Lưu và tạo lộ trình'}
          </Button>
          {save.isError && !Object.keys((save.error as ApiError).fieldErrors ?? {}).length && (
            <Alert severity="error" role="alert">
              {save.error.message}
            </Alert>
          )}
          {hasFieldErrors && (
            <Alert severity="error" role="alert">
              Kiểm tra lại các trường được đánh dấu.
            </Alert>
          )}
          <Typography variant="caption" color="text.secondary">
            Bạn chủ động. MyStudy đồng hành.
          </Typography>
        </Stack>
      </Card>
    </Box>
  )
}
