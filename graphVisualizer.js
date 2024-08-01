import Graph from 'graphology';
import forceAtlas2 from "graphology-layout-forceatlas2";
import Sigma from "sigma";
import Papa from "papaparse";
import circular from "graphology-layout/circular";

// CSV 데이터를 저장할 전역 변수
let csvData = [];
const yearFiles = {
    'edges_2019': '/data/edge_data_2019.csv',
    'edges_2020': '/data/edge_data_2020.csv',
    'edges_2021': '/data/edge_data_2021.csv',
    'edges_2022': '/data/edge_data_2022.csv',
    'edges_2023': '/data/edge_data_2023.csv',
};
const titleFiles = {
    'edges_2019': '/data/edges_title_to_tag_2019.csv',
    'edges_2020': '/data/edges_title_to_tag_2020.csv',
    'edges_2021': '/data/edges_title_to_tag_2021.csv',
    'edges_2022': '/data/edges_title_to_tag_2022.csv',
    'edges_2023': '/data/edges_title_to_tag_2023.csv',
};

document.addEventListener('DOMContentLoaded', function() {
    console.log("CSV 파일 로드 시작");
    // 초기 로드
    loadMultipleCSVs(['/data/edge_data_2019.csv']);

    // 이벤트 리스너 추가
    document.querySelectorAll('.checkbox-wrapper input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', handleOptionChange);
    });
});

function handleOptionChange() {
    const selectedFiles = [];
    const selectedTitleFiles = [];
    const isGameTitleOn = document.getElementById('game-title-on').checked;

    for (const year in yearFiles) {
        if (document.getElementById(year).checked) {
            selectedFiles.push(yearFiles[year]);
            if (isGameTitleOn) {
                selectedTitleFiles.push(titleFiles[year]);
            }
        }
    }

    console.log(`CSV 파일 로드 시작: ${selectedFiles.concat(selectedTitleFiles).join(', ')}`);
    loadMultipleCSVs(selectedFiles.concat(selectedTitleFiles));
}

function loadMultipleCSVs(csvPaths) {
    csvData = [];
    Promise.all(csvPaths.map(path => fetch(path).then(response => response.arrayBuffer().then(buffer => ({ buffer, path }))))) // Return both buffer and path
        .then(results => {
            results.forEach(({ buffer, path }) => {
                const encoding = detectEncoding(buffer);
                const text = decodeText(buffer, encoding);
                parseCSV(text, path.includes('title_to_tag'));
            });
            drawGraph();
        })
        .catch(error => {
            console.error('Error loading CSV files:', error);
        });
}

function detectEncoding(buffer) {
    // 임시로 euc-kr를 반환 (필요한 경우 다른 인코딩 감지 로직 추가 가능)
    return 'latin1';
}

function decodeText(arrayBuffer, encoding) {
    const decoder = new TextDecoder(encoding);
    return decoder.decode(new Uint8Array(arrayBuffer));
}

function parseCSV(text, isTitleFile) {
    Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
            results.data.forEach(row => {
                row.isTitleFile = isTitleFile;
            });
            csvData = csvData.concat(results.data);
            console.log("CSV 파일 로드 완료");
        },
        error: function(err) {
            console.error("CSV 파일 로드 오류:", err);
        }
    });
}

let graph;
let renderer;
let container;

function drawGraph() {
  if (csvData && csvData.length > 0) {
    graph = new Graph();

    // Find the maximum weight
    let maxWeight = 0;
    csvData.forEach((row) => {
      if (row.Weight > maxWeight) {
        maxWeight = row.Weight;
      }
    });

    // Normalize weights and add nodes/edges to the graph
    const nodeSet = new Set();
    csvData.forEach((row) => {
      const { Source1, Source2, Weight, isTitleFile } = row;

      // Check if Source1 and Source2 are defined
      if (!Source1 || !Source2) {
        console.warn('Source1 또는 Source2가 정의되지 않음:', row);
        return;
      }

      const normalizedWeight = Weight / maxWeight; // Scale the weight

      const sourceNode = Source1.trim();
      const targetNode = Source2.trim();

      nodeSet.add(sourceNode);
      nodeSet.add(targetNode);

      if (!graph.hasNode(sourceNode)) {
        graph.addNode(sourceNode, { label: sourceNode, color: isTitleFile ? 'blue' : 'gray' });
      }
      if (!graph.hasNode(targetNode)) {
        graph.addNode(targetNode, { label: targetNode, color: 'gray' });
      }
      if (!graph.hasEdge(sourceNode, targetNode)) {
        graph.addEdge(sourceNode, targetNode, { size: normalizedWeight * 2 });
      }
    });

    // Circle layout
    circular.assign(graph);

    // Degree-based node size adjustment
    const degrees = graph.nodes().map((node) => graph.degree(node));
    const minDegree = Math.min(...degrees);
    const maxDegree = Math.max(...degrees);
    const minSize = 3,
      maxSize = 15;
    graph.forEachNode((node) => {
      const degree = graph.degree(node);
      graph.setNodeAttribute(
        node,
        'size',
        minSize + ((degree - minDegree) / (maxDegree - minDegree)) * (maxSize - minSize)
      );
    });

    // Run Force Atlas 2 for a fixed number of iterations
    forceAtlas2.assign(graph, { iterations: 500 });

    // Clear previous graph if exists
    if (renderer) {
      renderer.kill();
      renderer = null;
    }

    // Sigma.js settings to enlarge node labels
    container = document.getElementById('sigma-container');
    container.innerHTML = '';
    renderer = new Sigma(graph, container);

    // State to manage hovered and selected nodes
    const state = {
      hoveredNode: undefined,
      hoveredNeighbors: new Set(),
    };

    // Add event listeners for highlighting
    renderer.on('enterNode', ({ node }) => {
      setHoveredNode(node);
    });

    renderer.on('leaveNode', () => {
      setHoveredNode(undefined);
    });

    function setHoveredNode(node) {
      if (node) {
        state.hoveredNode = node;
        state.hoveredNeighbors = new Set(graph.neighbors(node));
      } else {
        state.hoveredNode = undefined;
        state.hoveredNeighbors = new Set();
      }
      refreshGraph();
    }

    function refreshGraph() {
      renderer.setSetting('nodeReducer', (node, data) => {
        const res = { ...data };
        if (state.hoveredNode && !state.hoveredNeighbors.has(node) && state.hoveredNode !== node) {
          res.color = '#f6f6f6';
          res.label = '';
        } else {
          res.color = data.color;
          res.label = data.label;
        }
        return res;
      });

      renderer.setSetting('edgeReducer', (edge, data) => {
        const res = { ...data };
        if (state.hoveredNode && !graph.hasExtremity(edge, state.hoveredNode)) {
          res.hidden = true;
        } else {
          res.hidden = false;
        }
        return res;
      });

      renderer.refresh();
    }
  } else {
    console.error('불러온 CSV 데이터가 없습니다.');
  }
}