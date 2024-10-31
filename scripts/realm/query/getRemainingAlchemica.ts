import axios from "axios";
import { BigNumber, utils } from "ethers";
import fs from "fs";

const SUBGRAPH_URL = process.env.GOTCHIVERSE_URI; //alchemy subgraph url
const PARCELS_PER_REQUEST = 1000;
const TOTAL_PARCELS = 56000;

interface Parcel {
  id: string;
  remainingAlchemica: string[];
  surveyRound: number;
  size: number;
}

interface QueryResult {
  data: {
    parcels: Parcel[];
  };
}

interface SurveyRoundCount {
  total: number;
  sizeCount: { [key: number]: number };
}

async function fetchParcels(skip: number): Promise<Parcel[]> {
  const query = `
    query {
      parcels(first: ${PARCELS_PER_REQUEST}, skip: ${skip}) {
        id
        remainingAlchemica
        surveyRound
        size
      }
    }
  `;

  const response = await axios.post<QueryResult>(SUBGRAPH_URL, { query });
  return response.data.data.parcels;
}

async function getTotalRemainingAlchemicaAndSurveyRounds(): Promise<
  [BigNumber[], SurveyRoundCount[]]
> {
  const totalAlchemica = [
    BigNumber.from(0), // FUD
    BigNumber.from(0), // FOMO
    BigNumber.from(0), // ALPHA
    BigNumber.from(0), // KEK
  ];
  const surveyRoundCounts: SurveyRoundCount[] = Array(9)
    .fill(null)
    .map(() => ({
      total: 0,
      sizeCount: { 0: 0, 1: 0, 2: 0, 3: 0 },
    }));

  for (let i = 0; i < TOTAL_PARCELS; i += PARCELS_PER_REQUEST) {
    const parcels = await fetchParcels(i);

    for (const parcel of parcels) {
      parcel.remainingAlchemica.forEach((amount, index) => {
        totalAlchemica[index] = totalAlchemica[index].add(
          BigNumber.from(amount)
        );
      });

      if (parcel.surveyRound >= 0 && parcel.surveyRound <= 8) {
        surveyRoundCounts[parcel.surveyRound].total++;
        surveyRoundCounts[parcel.surveyRound].sizeCount[parcel.size]++;
      }
    }

    console.log(`Processed ${i + parcels.length} parcels`);
  }

  return [totalAlchemica, surveyRoundCounts];
}

function formatNumberForCsv(value: string): string {
  // Remove commas and limit to 15 decimal places
  return parseFloat(value.replace(/,/g, "")).toFixed(15);
}

function exportToCsv(filename: string, rows: string[][]): void {
  const csvContent = rows.map((row) => row.join(",")).join("\n");
  fs.writeFileSync(filename, csvContent);
  console.log(`CSV file exported: ${filename}`);
}

async function main() {
  try {
    const [totalRemainingAlchemica, surveyRoundCounts] =
      await getTotalRemainingAlchemicaAndSurveyRounds();
    const alchemicaTypes = ["FUD", "FOMO", "ALPHA", "KEK"];

    // Export total remaining Alchemica to CSV
    const alchemicaRows = [
      ["Alchemica Type", "Remaining Amount"],
      ...alchemicaTypes.map((type, index) => [
        type,
        formatNumberForCsv(utils.formatEther(totalRemainingAlchemica[index])),
      ]),
    ];
    exportToCsv("remaining_alchemica.csv", alchemicaRows);

    // Export survey round counts to CSV
    const surveyRows = [
      [
        "Survey Round",
        "Total Parcels",
        "Size 0 Parcels",
        "Size 1 Parcels",
        "Size 2 Parcels",
        "Size 3 Parcels",
      ],
    ];
    surveyRoundCounts.forEach((count, round) => {
      surveyRows.push([
        round.toString(),
        count.total.toString(),
        count.sizeCount[0].toString(),
        count.sizeCount[1].toString(),
        count.sizeCount[2].toString(),
        count.sizeCount[3].toString(),
      ]);
    });
    exportToCsv("survey_round_counts.csv", surveyRows);

    console.log("Data export completed.");
  } catch (error) {
    console.error(
      "Error fetching remaining Alchemica and survey rounds:",
      error
    );
  }
}

main();
