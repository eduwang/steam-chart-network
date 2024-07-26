import Graph from 'graphology';
import forceAtlas2 from "graphology-layout-forceatlas2";
import Sigma from "sigma";
import Papa from "papaparse";

// CSV 데이터를 저장할 전역 변수
let csvData;

document.addEventListener('DOMContentLoaded', function() {
    console.log("CSV 파일 로드 시작");
    loadData('/data/sample_data_02_SH.csv', 'csv-loaded');
});

function loadData(csvPath, className) {
    const csvFilePath = csvPath; // CSV 파일 경로
    fetch(csvFilePath)
        .then(response => response.arrayBuffer())
        .then(arrayBuffer => {
            const encoding = detectEncoding(arrayBuffer);
            const text = decodeText(arrayBuffer, encoding); // 인코딩된 텍스트 디코딩
            parseCSV(text);
            showDescription(className); // 설명을 표시
        })
        .catch(error => {
            console.error('Error loading CSV file:', error);
        });
}

function detectEncoding(buffer) {
    // 임시로 euc-kr를 반환 (필요한 경우 다른 인코딩 감지 로직 추가 가능)
    return 'euc-kr';
}

function decodeText(arrayBuffer, encoding) {
    const decoder = new TextDecoder(encoding);
    return decoder.decode(new Uint8Array(arrayBuffer));
}

function parseCSV(text) {
    Papa.parse(text, {
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
}

function showDescription(className) {
    // 모든 설명을 숨깁니다.
    const descriptions = document.querySelectorAll('.description');
    descriptions.forEach(function(description) {
        description.style.display = 'none';
    });

    // 해당 설명을 표시합니다.
    const selectedDescription = document.querySelector('.' + className);
    if (selectedDescription) {
        selectedDescription.style.display = 'block';
    }
}

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

            // Check if Source1 and Source2 are defined
            if (!Source1 || !Source2) {
                console.warn('Source1 또는 Source2가 정의되지 않음:', row);
                return;
            }

            const normalizedWeight = Weight / maxWeight; // Scale the weight

            const sourceNode = Source1.trim();
            const targetNode = Source2.trim();

            if (!graph.hasNode(sourceNode)) {
                // Assign initial random x and y coordinates
                graph.addNode(sourceNode, { label: sourceNode, x: Math.random(), y: Math.random() });
            }
            if (!graph.hasNode(targetNode)) {
                // Assign initial random x and y coordinates
                graph.addNode(targetNode, { label: targetNode, x: Math.random(), y: Math.random() });
            }
            // Check if the edge already exists before adding it
            if (!graph.hasEdge(sourceNode, targetNode)) {
                graph.addEdge(sourceNode, targetNode, { size: normalizedWeight * 2 });
            }
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
        
        // Position nodes on a circle, then run Force Atlas 2 for a while to get proper graph layout:  
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
