import EventEmitter from 'events';
import xml2js from 'xml2js';

export class DataFeed extends EventEmitter {
    private matchIds: string[] = [];
    private emitChunkedBuffer = false;

    constructor(options?: { amountOfMatches?: number; emitChunkedBuffer?: boolean }) {
        super();
        const amountOfMatches = options?.amountOfMatches ?? 3;
        const emitChunkedBuffer = options?.emitChunkedBuffer ?? false;

        this.matchIds = Array.from({ length: amountOfMatches }, (_, i) => this.getRandomString());
        this.emitChunkedBuffer = emitChunkedBuffer;
    }

    connect() {
        this.startDataFeed();
    }

    private getRandomMatchId() {
        const randomMatchIdIndex = this.getRandomIntInclusive(0, this.matchIds.length - 1);
        return this.matchIds[randomMatchIdIndex];
    }

    private randomMatchIdGetter() {
        const usedMatchIds: string[] = [];

        return () => {
            let randomMatchId: string;

            do {
                randomMatchId = this.getRandomMatchId();
            } while (usedMatchIds.includes(randomMatchId));

            usedMatchIds.push(randomMatchId);
            return randomMatchId;
        };
    }

    private async startDataFeed() {
        while (true) {
            const numberOfOddsChangesToGenerate = this.getRandomIntInclusive(1, this.matchIds.length);
            const getRandomMatchIdForIteration = this.randomMatchIdGetter();

            const getOddsChangeBuffer = () => {
                const xmlJsonRepresentation = {
                    odds: {
                        $: { match: getRandomMatchIdForIteration() },
                        odds: [this.getRandomFloatInclusive(1, 4).toFixed(2)],
                        time: [new Date().toISOString()],
                    },
                };

                const matchOddsUpdateXml = this.getXmlFromJson(xmlJsonRepresentation, true);

                const nullByte = Buffer.from([0x00]);
                return Buffer.concat([Buffer.from(matchOddsUpdateXml), nullByte]);
            };

            let bufferChunks = Array.from({ length: numberOfOddsChangesToGenerate }, (_, i) => getOddsChangeBuffer());

            bufferChunks = this.emitChunkedBuffer ? this.getChunkedBuffers(bufferChunks) : bufferChunks;

            for (const bufferChunk of bufferChunks) {
                this.emit('data', bufferChunk);
            }

            await new Promise((resolve) => setTimeout(resolve, this.getRandomIntInclusive(2000, 6000)));
        }
    }

    private getChunkedBuffers(buffers: Buffer[]) {
        const oddsChangesBuffer = Buffer.concat(buffers);
        const numberOfBufferChunks = this.getRandomIntInclusive(1, 7);
        const bufferChunkSize = Math.floor(oddsChangesBuffer.length / numberOfBufferChunks);

        const chunks = Array.from({ length: numberOfBufferChunks }, (_, i) => i).map((_, index, array) => {
            const isLastItem = array.length - 1 === index;
            return [index * bufferChunkSize, isLastItem ? oddsChangesBuffer.length : index * bufferChunkSize + bufferChunkSize];
        });

        return chunks.map(([startIndex, endIndex]) => oddsChangesBuffer.subarray(startIndex, endIndex));
    }

    private getRandomIntInclusive(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    private getRandomFloatInclusive(min, max) {
        return Math.random() * (max - min + 1) + min;
    }

    private getRandomString() {
        return Math.random().toString(36).substr(2, 8);
    }

    private getXmlFromJson(xmlRepresentation: Record<string, any>, headless = false, rootName = 'root') {
        const builder = new xml2js.Builder({
            renderOpts: { pretty: true, indent: '  ', newline: '\n' },
            headless,
            rootName,
        });

        return builder.buildObject(xmlRepresentation);
    }
}
