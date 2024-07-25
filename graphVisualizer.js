import Graph from 'graphology';
import forceAtlas2 from "graphology-layout-forceatlas2";
import Sigma from "sigma";
import Papa from "papaparse";

// CSV 데이터를 저장할 전역 변수
let csvData;

document.addEventListener('DOMContentLoaded', function() {
    // CSV 데이터 로드
    console.log("CSV 파일 로드 시작");
    Papa.parse('/data/sample_data_02_SH.csv', {
        download: true,
        header: true,
        complete: function(results) {
            csvData = results.data;
            console.log("CSV 파일 로드 완료");
            console.log(csvData);
            drawGraph();
        },
        error: function(err) {
            console.error("CSV 파일 로드 오류:", err);
        }
    });
});

let graph;
let sigmaInstance;
let container;

function drawGraph() {
    if (csvData && csvData.length > 0) {
        graph = new Graph();
        
        // Find the maximum weight
        let maxWeight = 0;
        csvData.forEach(row => {
            if (row.Weight > maxWeight) {
                maxWeight = row.Weight;
            }
        });

        // Normalize weights and add nodes/edges to the graph
        csvData.forEach(row => {
            const { Source1, Source2, Weight } = row;
            const normalizedWeight = Weight / maxWeight; // Scale the weight

            const sourceNode = Source1.trim();
            const targetNode = Source2.trim();

            if (!graph.hasNode(sourceNode)) {
                graph.addNode(sourceNode, { label: sourceNode });
            }
            if (!graph.hasNode(targetNode)) {
                graph.addNode(targetNode, { label: targetNode });
            }
            graph.addEdge(sourceNode, targetNode, { size: normalizedWeight * 2 });
        });

        // Degree-based node size adjustment
        const degrees = graph.nodes().map((node) => graph.degree(node));
        const minDegree = Math.min(...degrees);
        const maxDegree = Math.max(...degrees);
        const minSize = 3, maxSize = 15;
        graph.forEachNode((node) => {
            const degree = graph.degree(node);
            graph.setNodeAttribute(
              node,
              "size",
              minSize + ((degree - minDegree) / (maxDegree - minDegree)) * (maxSize - minSize),
            );
          });
        
        //Position nodes on a circle, then run Force Atlas 2 for a while to get proper graph layout:  
        forceAtlas2.assign(graph, { iterations: 500 });

        // Clear previous graph if exists
        if (sigmaInstance) {
            sigmaInstance.kill();
            sigmaInstance = null;
        }
        
        // Sigma.js settings to enlarge node labels
        container = document.getElementById('sigma-container');
        container.innerHTML = '';
        sigmaInstance = new Sigma(graph, container);
    } else {
        console.error('불러온 CSV 데이터가 없습니다.');
    }
}
