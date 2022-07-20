import {getChecksumsFromFile, getFileSum, downloadAndVerifyFileIntegrity} from '../../shared/downloadAndVerifyFileIntegrity';
import * as downloadFileModule from '../../shared/downloadFileToDest';
import path from 'path';

describe('Download and verify file integrity', () => {
    it('should get sums list from file', async () => {
        const sumsList = await getChecksumsFromFile(path.join(__dirname, 'sha256_example.txt'));
        expect(sumsList).toEqual({
            linux: '4f374b4aad0324930e63cb33f4241de3a4adb80ec83359e6414c81bc44c1399e',
            macos: '6b9f7563f5993159bbf6a6770027883e7810efdcd0aebf82edce04efb9ea81b9',
            win: 'ce8192a608fe8c90b16c45e2e7d130fd136fb08b4ea82ab34ef3fc9bd5ec3f2e'
        });
    });

    it('should throw error if file format is invalid', async () => {
        try {
            await getChecksumsFromFile(path.join(__dirname, './downloadAndVerifyFileIntegrity.spec.ts'));
        } catch ({message}) {
            expect(message).toBe('The sums file is corrupted or the file format is not compatible');
        }
    });

    it('should get sum for a given file', async () => {
        const fileHash = await getFileSum(path.join(__dirname, 'exampleFileToVerify'));
        expect(fileHash).toBe('ce8192a608fe8c90b16c45e2e7d130fd136fb08b4ea82ab34ef3fc9bd5ec3f2e');
    });

    it(`should download file and check integrity when it's ok`, async () => {
        const spy = jest.spyOn(downloadFileModule, 'downloadFileToDest');
        spy.mockResolvedValue();
        await downloadAndVerifyFileIntegrity({
            platform: 'win',
            downloadUrl: 'mockUrl',
            downloadDest: path.join(__dirname, 'exampleFileToVerify'),
            sumFileUrl: 'mockUrl',
            sumFileDest: path.join(__dirname, 'sha256_example.txt')
        });
        spy.mockRestore();
    });

    it(`should retry download file if integrity fails`, async () => {
        const spy = jest.spyOn(downloadFileModule, 'downloadFileToDest');
        spy.mockResolvedValue();
        const retries = 5;
        try {
            await downloadAndVerifyFileIntegrity({
                platform: 'win',
                downloadUrl: 'mockUrl',
                downloadDest: path.join(__dirname, 'sha256_example.txt'),
                sumFileUrl: 'mockUrl',
                sumFileDest: path.join(__dirname, 'sha256_example.txt'),
                retryOptions: {
                    retries,
                    minTimeout: 0,
                    maxTimeout: 1
                }
            });
        } catch (error: any) {
            expect(error.message).toBe(
                'File seems corrupted current sum is: 86b0dd629ee2448ccc089d77a030f1c6e619d311bd0072649666521b830f7747 expected was ce8192a608fe8c90b16c45e2e7d130fd136fb08b4ea82ab34ef3fc9bd5ec3f2e, downloading it again'
            );
            expect(spy.mock.calls.length).toBe((retries + 1) * 2);
        }
        spy.mockRestore();
    });
});
