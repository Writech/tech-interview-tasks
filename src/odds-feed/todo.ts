import { DataFeed } from './lib';

(async () => {
    const dataFeed = new DataFeed();

    interface OddsChange {
        match: string;
        odds: string;
        time: string;
    }

    type OddsHistory = [string, string, string]

    const oddsHistoryLimit = 5;
    const oddsByMatch: Record<string, { currentOdds: string; oddsHistory: OddsHistory[] }> = {};

    dataFeed.on('data', async (buffer: Buffer) => {
        // TODO
        // Use "xml2js" library to convert xml to json;
        // const oddsChange: OddsChange = {};
        // handleOddsChange(oddsChange);
        // printOddsData();
    });

    dataFeed.connect();

    function handleOddsChange(oddsChange: OddsChange) {
        // TODO
    }

    function printOddsData() {
        // TODO
    }
})();
