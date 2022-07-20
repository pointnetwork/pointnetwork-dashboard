/** @jest-environment node */
import {BrowserWindow} from 'electron';
import WelcomeService from './service';
import {WelcomeChannelsEnum} from '../@types/ipc_channels';

type Args = [WelcomeChannelsEnum, any]

// eslint-disable-next-line @typescript-eslint/no-empty-function
const mockSend = jest.fn(() => {});

const mockWindow = {webContents: {send: mockSend}};

describe('WelcomeService', () => {
    const welcomeService = new WelcomeService(mockWindow as unknown as BrowserWindow);

    it('should generate a secret phrase and validate it with a subset of words', async () => {
        expect.assertions(6);

        await welcomeService.generate();
        welcomeService.getGeneratedMnemonic();
        const picks = welcomeService.pickRandomWords();
        const words = picks.map(i => i.word);
        welcomeService.verifyWords(words);

        const calls = mockSend.mock.calls as unknown as Args[];
        expect(calls[0][0]).toBe(WelcomeChannelsEnum.get_dictionary);
        expect(calls[1][0]).toBe(WelcomeChannelsEnum.generate_mnemonic);
        expect(calls[2][0]).toBe(WelcomeChannelsEnum.get_mnemonic);
        expect(calls[3][0]).toBe(WelcomeChannelsEnum.pick_words);
        expect(calls[4][0]).toBe(WelcomeChannelsEnum.validate_words);
        expect(calls[4][1]).toBe(true);
    });
});
