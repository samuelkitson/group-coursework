const { parentPort, workerData } = require("worker_threads");
const { AllocationAlgorithm } = require("../algorithm/algorithm");

try {
  // Create the AllocationAlgorithm instance using the data object from the main
  // thread.
  const algo = new AllocationAlgorithm(workerData);
  
  // Run the algorithm.
  algo.createInitialPopulation();
  algo.run();
  
  // Get the final results.
  const returnObj = algo.bestAllocationDetails();
  
  // Send result back to main thread.
  parentPort.postMessage({ success: true, result: returnObj });
  
} catch (error) {
  // If an error occurred, send it back to the main thread.
  parentPort.postMessage({ 
    success: false, 
    error,
  });
}
