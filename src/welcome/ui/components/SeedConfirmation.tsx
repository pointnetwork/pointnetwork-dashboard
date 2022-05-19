import { MouseEventHandler, useState, useEffect } from 'react'
import { pickMultipleRandomly } from '../../helpers/random'
// Material UI
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'
// Components
import NoShareWarning from './NoShareWarning'
import WordInput from './WordInput'

const WORDS_TO_CONFIRM = 3

interface Props {
  seed: string
  goBack: MouseEventHandler
}

type WordState = {
  wordIdx: number
  word: string
  userInput: string
}

type State = Record<number, WordState>

function generateInitialState(seed: string): State {
  const words = seed.split(' ')
  const state: State = {}
  const picks = pickMultipleRandomly(words, WORDS_TO_CONFIRM)
  picks.forEach(pick => {
    const wordIdx = words.findIndex(w => w === pick)
    state[wordIdx] = { wordIdx, word: pick, userInput: '' }
  })
  return state
}

export default function SeedConfirmation({ seed, goBack }: Props) {
  const [state, setState] = useState<State>(() => generateInitialState(seed))
  const [areAllCorrect, setAreAllCorrect] = useState(false)
  const [dictionary, setDictionary] = useState<string[]>([])

  useEffect(() => {
    window.Welcome.getDictionary()
    window.Welcome.on('welcome:set_dictionary', (d: string[]) => {
      setDictionary(d)
    })
  }, [])

  useEffect(() => {
    setAreAllCorrect(Object.values(state).every(i => i.word === i.userInput))
  }, [state])

  const validate = () => {
    if (areAllCorrect) {
      window.Welcome.login({ phrase: seed })
    }
  }

  const changeHandler = (wordIdx: number, value: string) => {
    setState(prev => ({
      ...prev,
      [wordIdx]: {
        ...prev[wordIdx],
        userInput: value.toLowerCase(),
      },
    }))
  }

  return (
    <Box display="flex" flexDirection="column">
      <Typography>
        Please enter the requested words from your secret phrase to make sure
        you got it right:
      </Typography>

      <Grid
        container
        sx={{ py: 4, px: 2 }}
        display="flex"
        flexDirection="row"
        justifyContent="space-between"
        rowSpacing={3}
      >
        {Object.values(state).map(v => (
          <WordInput
            dictionary={dictionary}
            key={v.wordIdx}
            wordIdx={v.wordIdx}
            value={v.userInput}
            onChange={changeHandler}
            isCorrect={v.userInput === v.word}
          />
        ))}
      </Grid>

      <Box>
        <Button variant="outlined" onClick={goBack}>
          Go Back
        </Button>

        <Button
          variant="contained"
          onClick={validate}
          disabled={!areAllCorrect}
          sx={{ mx: '.7rem' }}
        >
          Confirm
        </Button>
      </Box>

      <Divider sx={{ mt: '1.5rem', mb: '.7rem' }} />

      <NoShareWarning />
    </Box>
  )
}
