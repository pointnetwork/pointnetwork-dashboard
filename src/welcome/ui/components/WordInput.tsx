import Grid from '@mui/material/Grid'
import Autocomplete from '@mui/material/Autocomplete'
import TextField from '@mui/material/TextField'

interface Props {
  dictionary: string[]
  wordIdx: number
  value: string
  onChange: (wordIdx: number, value: string) => void
  isCorrect: boolean
}

export default function WordInput({
  dictionary,
  wordIdx,
  value,
  onChange,
  isCorrect,
}: Props) {
  const filter = (
    options: string[],
    { inputValue }: { inputValue: string }
  ) => {
    if (inputValue.length < 2) return []
    return options.filter(o => o.startsWith(inputValue))
  }

  return (
    <Grid item>
      <Autocomplete
        disablePortal
        options={dictionary}
        sx={{ width: 250 }}
        freeSolo
        openOnFocus={false}
        disableClearable={true}
        filterOptions={filter}
        inputValue={value}
        onInputChange={(_, val: string) => onChange(wordIdx, val)}
        renderInput={params => (
          <TextField
            {...params}
            label={`Word number ${wordIdx + 1}`}
            error={!!value && !isCorrect}
            color={isCorrect ? 'success' : 'primary'}
          />
        )}
      />
    </Grid>
  )
}
