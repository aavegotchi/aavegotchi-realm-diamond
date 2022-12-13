import { readFromJSON, writeCleanedDataToJSON, writeRemovedDataToJSON } from "./request/output";

const removeFinalUpgrades = () => {
    let startTime = new Date().getTime();
  
    let jsonData = readFromJSON();
  
    let jsonDataSize = jsonData?.length;
  
    let cleanedJsonData = [];
  
    let removedJsonData = [];
  
    let visitedData = [{ x: "", y: "", parcel: { id: "" } }];
  
    console.log("--- Please wait ----");
    for (let dataIndex = 0; dataIndex < jsonDataSize; dataIndex++) {
      let { x, y, parcel } = jsonData[dataIndex];
  
      if (
        visitedData.filter(
          (value) =>
            value.x === x && value.y === y && value.parcel?.id === parcel.id
        )?.length === 0
      ) {
        let filteredJsonData = jsonData
          .slice(dataIndex, jsonDataSize)
          .filter((jsonItem: any) => {
            const { x: x2, y: y2, parcel: parcel2 } = jsonItem;
            return x === x2 && y === y2 && parcel?.id === parcel2?.id;
          });
  
        let lastItem = filteredJsonData[filteredJsonData.length - 1];
  
        // --- run this if the array is not empty. i.e if there is a last item ----
        if (lastItem) {
          removedJsonData.push(lastItem);
          filteredJsonData.pop();
        }
  
        visitedData.push({ x, y, parcel });
  
        cleanedJsonData.push(...filteredJsonData);
  
        console.log("---- block ---", dataIndex);
      }
    }
  
    writeCleanedDataToJSON(cleanedJsonData);
    writeRemovedDataToJSON(removedJsonData);
  
    let endTime = new Date().getTime();
  
    console.log("STATISTICS:", {
      totalSize: jsonDataSize,
      cleanedDataSize: cleanedJsonData?.length,
      removedDataSize: removedJsonData?.length,
      executionTime: (endTime - startTime) / 1000,
    });


  };

  removeFinalUpgrades();