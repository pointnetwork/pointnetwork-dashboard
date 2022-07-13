import { getFileSum, getSumsHashFromFile } from '../../shared/downloadAndVerifyFileIntegrity'
import path from 'path';

describe('Download and verify file integrity', () => {
  it('should get sums list from file', async () => {
    const sumsList = await getSumsHashFromFile(path.join(__dirname, 'sha256_example.txt'));
    expect(sumsList).toEqual({
      linux: '4f374b4aad0324930e63cb33f4241de3a4adb80ec83359e6414c81bc44c1399e',
      macos: '6b9f7563f5993159bbf6a6770027883e7810efdcd0aebf82edce04efb9ea81b9',
      win: '6fcdf978ef51553adfb5bbcd8621b72d2a8a186c86da50a753003747d0546366',
    })
  })

  it('should throw error if file format is invalid', async () => {
    try {
      await getSumsHashFromFile(path.join(__dirname, './downloadAndVerifyFileIntegrity.spec.ts'))
    } catch ({ message }) {
      expect(message).toBe('The sums file is corrupted or the file format is not compatible')
    }
  })

  it('should get sum for a given file', async () => {
    const fileHash = await getFileSum(path.join(__dirname, 'sha256_example.txt'))
    expect(fileHash).toBe('183cec05da74de5c79e55268f3f32df113b0c047c9f25a6d4df8707b9568291a')
  })

  it('should download file and check integrity') {
    
  }
})