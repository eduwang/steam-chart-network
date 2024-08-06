import Graph from 'graphology';
import forceAtlas2 from "graphology-layout-forceatlas2";
import Sigma from "sigma";
import Papa from "papaparse";
import circular from "graphology-layout/circular";
import { degreeCentrality } from 'graphology-metrics/centrality/degree';
import eigenvectorCentrality from 'graphology-metrics/centrality/eigenvector';
import louvain from 'graphology-communities-louvain';
import { NodeBorderProgram } from "@sigma/node-border";

// CSV 데이터를 저장할 전역 변수
let csvData = [];
const yearFiles = {
    'edges_2019': '/data/edges_btn_udt_2019_final.csv',
    'edges_2020': '/data/edges_btn_udt_2020_final.csv',
    'edges_2021': '/data/edges_btn_udt_2021_final.csv',
    'edges_2022': '/data/edges_btn_udt_2022_final.csv',
    'edges_2023': '/data/edges_btn_udt_2023_final.csv',
};
const platinumFiles = {
    'edges_2019': '/data/edges_btn_udt_2019_platinum.csv',
    'edges_2020': '/data/edges_btn_udt_2020_platinum.csv',
    'edges_2021': '/data/edges_btn_udt_2021_platinum.csv',
    'edges_2022': '/data/edges_btn_udt_2022_platinum.csv',
    'edges_2023': '/data/edges_btn_udt_2023_platinum.csv',
};
const titleFiles = {
  'edges_2019': '/data/title_to_tag_2019.csv',
  'edges_2020': '/data/title_to_tag_2020.csv',
  'edges_2021': '/data/title_to_tag_2021.csv',
  'edges_2022': '/data/title_to_tag_2022.csv',
  'edges_2023': '/data/title_to_tag_2023.csv',
};
const jaccardFiles = {
    'jaccard_2019': '/data/jaccard_2019.csv',
    'jaccard_2020': '/data/jaccard_2020.csv',
    'jaccard_2021': '/data/jaccard_2021.csv',
    'jaccard_2022': '/data/jaccard_2022.csv',
    'jaccard_2023': '/data/jaccard_2023.csv',
};

document.addEventListener('DOMContentLoaded', function() {
    console.log("CSV 파일 로드 시작");
    // 초기 로드
    loadMultipleCSVs([yearFiles['edges_2019']], 'chart-container1');

    // 이벤트 리스너 추가
    document.querySelectorAll('.checkbox-wrapper input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', handleOptionChange);
    });

    // 플래티넘 티어 체크박스 리스너 추가
    document.querySelectorAll('.checkbox-container label input[type="checkbox"]').forEach(checkbox => {
        if (checkbox.id.startsWith('platinum_')) {
            checkbox.addEventListener('change', handlePlatinumChange);
        }
    });

    // 범례 표시/숨기기 이벤트 리스너 추가
    document.getElementById('game-title-on').addEventListener('change', () => toggleLegend('tier-legend'));
    document.getElementById('centrality-checkbox1').addEventListener('change', () => toggleCentralityTable('chart-container1'));
    document.getElementById('community-checkbox1').addEventListener('change', () => toggleCommunityTable('chart-container1'));

    document.getElementById('centrality-checkbox2').addEventListener('change', () => toggleCentralityTable('chart-container2'));
    document.getElementById('community-checkbox2').addEventListener('change', () => toggleCommunityTable('chart-container2'));

    // Chart switching
    document.getElementById('button1').addEventListener('click', () => showChart('chart-container1'));
    document.getElementById('button2').addEventListener('click', () => showChart('chart-container2'));
});

function toggleLegend(legendId) {
    const legend = document.getElementById(legendId);
    if (document.getElementById(`game-title-on`).checked) {
        legend.classList.remove('hidden');
    } else {
        legend.classList.add('hidden');
    }
}

function toggleCentralityTable(containerId) {
    const centralityTable = document.getElementById(`centrality-table`);
    if (document.getElementById(`centrality-checkbox${containerId === 'chart-container1' ? '1' : '2'}`).checked) {
        computeCentrality(containerId);
        centralityTable.classList.remove('hidden');
    } else {
        centralityTable.classList.add('hidden');
    }
}

function toggleCommunityTable(containerId) {
    const communityTable = document.getElementById(`community-table`);
    if (document.getElementById(`community-checkbox${containerId === 'chart-container1' ? '1' : '2'}`).checked) {
        communityAssign(containerId);
        communityTable.classList.remove('hidden');
    } else {
        communityTable.classList.add('hidden');
    }
}

function handleOptionChange() {
  const selectedFiles = [];
  const selectedTitleFiles = [];
  const containerId = this.closest('.chart-container').id;
  const suffix = containerId === 'chart-container1' ? 'edges' : 'jaccard';
  const isGameTitleOn = document.getElementById('game-title-on').checked;

  if (event.target.id.startsWith('edges_')) {
    document.querySelectorAll('.checkbox-container input[type="checkbox"]').forEach(checkbox => {
        if (checkbox.id.startsWith('platinum_')) {
            checkbox.checked = false;
        }
    });
    }

  for (const year in (suffix === 'edges' ? yearFiles : jaccardFiles)) {
      if (document.getElementById(`${year}`).checked) {
          selectedFiles.push(suffix === 'edges' ? yearFiles[year] : jaccardFiles[year]);
          if (isGameTitleOn && suffix === 'edges') {
              selectedTitleFiles.push(titleFiles[year]);
          }
      }
  }

  console.log(`CSV 파일 로드 시작: ${selectedFiles.concat(selectedTitleFiles).join(', ')}`);
  loadMultipleCSVs(selectedFiles.concat(selectedTitleFiles), containerId);
}

function handlePlatinumChange(event) {
    const platinumId = event.target.id.replace('platinum_', 'edges_');
    document.querySelectorAll('.checkbox-wrapper input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = false;
    });
    event.target.checked = true;
    loadMultipleCSVs([platinumFiles[platinumId]], 'chart-container1');
}


function loadMultipleCSVs(csvPaths, containerId) {
    csvData = [];
    Promise.all(csvPaths.map(path => fetch(path).then(response => response.arrayBuffer().then(buffer => ({ buffer, path }))))) // Return both buffer and path
        .then(results => {
            results.forEach(({ buffer, path }) => {
                const encoding = detectEncoding(buffer);
                const text = decodeText(buffer, encoding);
                parseCSV(text, path.includes('title_to_tag'));
            });
            drawGraph(containerId);

            const suffix = containerId === 'chart-container1' ? '1' : '2';
            // 중심성 체크박스가 체크된 경우 중심성 계산 및 업데이트
            if (document.getElementById(`centrality-checkbox${suffix}`).checked) {
                computeCentrality(containerId);
            }

            if (document.getElementById(`community-checkbox${suffix}`).checked) {
                communityAssign(containerId);
                document.getElementById(`community-table`).classList.remove('hidden');
            } else {
                document.getElementById(`community-table`).classList.add('hidden');
            }
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

let graphs = {};
let renderers = {};
let containers = {};

// Define color mapping for tiers
const tierColors = {
    'Platinum': '#E5E4E2',
    'Gold': '#FFD700',
    'Silver': '#C0C0C0',
    'Bronze': '#CD7F32'
};

const tierSizes = {
    'Platinum': 15,
    'Gold': 12,
    'Silver': 10,
    'Bronze': 8
};

function drawGraph(containerId) {
    if (csvData && csvData.length > 0) {
        const graph = new Graph();
        graphs[containerId] = graph;

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
            const { Source1, Source2, Weight, Tier, isTitleFile } = row;

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
                const color = isTitleFile ? (tierColors[Tier] || 'blue') : 'gray';
                const size = isTitleFile ? (tierSizes[Tier] || 10) : 5;
                graph.addNode(sourceNode, {
                    label: sourceNode,
                    color: color,
                    size: size,
                    isTitleFile: isTitleFile,
                    borderColor: isTitleFile ? 'red' : 'black', // Set border color based on isTitleFile
                });
            }
            if (!graph.hasNode(targetNode)) {
                graph.addNode(targetNode, {
                    label: targetNode,
                    color: 'black',
                    isTitleFile: isTitleFile,
                    borderColor: 'black',
                });
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
            if (!graph.getNodeAttribute(node, 'size')) { // Only adjust size if not set by tier
                graph.setNodeAttribute(
                    node,
                    'size',
                    minSize + ((degree - minDegree) / (maxDegree - minDegree)) * (maxSize - minSize)
                );
            }
        });

        // Run Force Atlas 2 for a fixed number of iterations
        forceAtlas2.assign(graph, { iterations: 1000 });

        // Clear previous graph if exists
        if (renderers[containerId]) {
            renderers[containerId].kill();
            renderers[containerId] = null;
        }

        // Sigma.js settings to enlarge node labels and include node borders
        const container = document.getElementById(containerId.replace('chart-container', 'sigma-container'));
        container.innerHTML = '';
        const renderer = new Sigma(graph, container, {
            nodePrograms: {
                border: NodeBorderProgram,
            },
        });

        renderers[containerId] = renderer;

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
                    res.borderColor = data.borderColor; // Ensure border color is maintained
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

function computeCentrality(containerId) {
    const graph = graphs[containerId];
    const centralityBody = document.getElementById(`centrality-body`);
    centralityBody.innerHTML = ''; // 기존 내용 제거
    let nodes = [];

    const degreeCen = degreeCentrality(graph);
    Object.keys(degreeCen).forEach(node => {
        if (!graph.getNodeAttribute(node, 'isTitleFile')) { // Exclude title files from centrality calculation
            graph.setNodeAttribute(node, 'degreeCentrality', parseFloat(degreeCen[node].toFixed(3)));
        }
    });

    // Eigenvector Centrality 계산 및 할당
    let eigenCen;
    try {
        eigenCen = eigenvectorCentrality(graph);
        Object.keys(eigenCen).forEach(node => {
            if (!graph.getNodeAttribute(node, 'isTitleFile')) { // Exclude title files from centrality calculation
                graph.setNodeAttribute(node, 'eigenvectorCentrality', parseFloat(eigenCen[node].toFixed(3)));
            }
        });
    } catch (error) {
        console.error('Error calculating eigenvector centrality:', error);
        graph.forEachNode(node => {
            if (!graph.getNodeAttribute(node, 'isTitleFile')) { // Exclude title files from centrality calculation
                graph.setNodeAttribute(node, 'eigenvectorCentrality', 'N/A');
            }
        });
    }

    // 노드를 중심성 기준으로 정렬 및 GameTitle 제외
    graph.forEachNode((node, attributes) => {
        if (!attributes.isTitleFile) { // Exclude title files from centrality calculation
            nodes.push({
                node: node,
                degreeCentrality: attributes.degreeCentrality,
                eigenvectorCentrality: attributes.eigenvectorCentrality
            });
        }
    });

    // 정렬: degreeCentrality를 우선, eigenvectorCentrality를 그 다음으로 기준
    nodes.sort((a, b) => {
        if (b.degreeCentrality !== a.degreeCentrality) {
            return b.degreeCentrality - a.degreeCentrality;
        } else {
            if (a.eigenvectorCentrality === 'N/A') return 1;
            if (b.eigenvectorCentrality === 'N/A') return -1;
            return b.eigenvectorCentrality - a.eigenvectorCentrality;
        }
    });

    // 중심성 테이블에 GameTitle을 제외하고 노드 추가
    nodes.forEach(({ node, degreeCentrality, eigenvectorCentrality }) => {
        const row = document.createElement('tr');
        const nodeCell = document.createElement('td');
        nodeCell.textContent = node;
        const degreeCell = document.createElement('td');
        degreeCell.textContent = degreeCentrality.toFixed(3);
        const eigenCell = document.createElement('td');
        eigenCell.textContent = eigenvectorCentrality === 'N/A' ? 'N/A' : eigenvectorCentrality.toFixed(3);
        row.appendChild(nodeCell);
        row.appendChild(degreeCell);
        row.appendChild(eigenCell);
        centralityBody.appendChild(row);
    });
}

let comResoulution = 1.0; // Default resolution value

function communityAssign(containerId, resolution = 1.0) {
    const graph = graphs[containerId];
    const communityBody = document.getElementById(`community-body`);
    communityBody.innerHTML = ''; // 기존 내용 제거

    const communities = louvain(graph, { resolution: comResoulution }); // Community detection using louvain algorithm with resolution
    let communityNodes = {};
    let communityWeights = {}; // 집단별 가중치 합을 저장할 객체
    let communityColors = {};

    graph.forEachNode((node, attributes) => {
        if (!attributes.isTitleFile) { // Exclude title files from community detection
            const community = communities[node];
            if (!communityNodes[community]) {
                communityNodes[community] = [];
                communityWeights[community] = 0; // 초기화
                communityColors[community] = getRandomColor(); // Assign a random color to the community
            }
            communityNodes[community].push(node);
            graph.setNodeAttribute(node, 'community', community);
            graph.setNodeAttribute(node, 'color', communityColors[community]); // Set the node color based on community
            graph.setNodeAttribute(node, 'label', `${node} (Community ${community})`); // Set the node label to include community
        }
    });

    // 집단별 가중치 합 계산
    Object.keys(communityNodes).forEach(community => {
        communityNodes[community].forEach(node => {
            graph.forEachEdge(node, (edge, attributes, source, target) => {
                if (communityNodes[community].includes(source) && communityNodes[community].includes(target)) {
                    communityWeights[community] += attributes.size; // 가중치 합 계산
                }
            });
        });
    });

    updateCommunityNodes(communityNodes, communityWeights, communityBody);
    refreshGraph(containerId);
}

function updateCommunityNodes(communityNodes, communityWeights, communityBody) {
    Object.keys(communityNodes).forEach(community => {
        const row = document.createElement('tr');
        const communityCell = document.createElement('td');
        communityCell.textContent = community;
        const nodesCell = document.createElement('td');
        nodesCell.textContent = communityNodes[community].join(', ');
        const weightCell = document.createElement('td');
        weightCell.textContent = Math.round(communityWeights[community]); // 가중치 합 반올림하여 표시
        row.appendChild(communityCell);
        row.appendChild(nodesCell);
        row.appendChild(weightCell);
        communityBody.appendChild(row);
    });
}


function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

document.getElementById('toggle-community').addEventListener('click', () => {
    const containerId = document.querySelector('.chart-container:not(.hidden)').id;
    communityAssign(containerId);
    refreshGraph(containerId); // Refresh the graph to apply new colors
});

document.getElementById('increase-community').addEventListener('click', () => {
    comResoulution += 0.1;
    if (comResoulution > 4.0){
        alert('집단 수가 너무 많습니다')
        comResoulution = 1.0
    }
    console.log(comResoulution)
    const containerId = document.querySelector('.chart-container:not(.hidden)').id;
    communityAssign(containerId);
    refreshGraph(containerId); // Refresh the graph to apply new colors
});

document.getElementById('decrease-community').addEventListener('click', () => {
    comResoulution -= 0.1;
    if (comResoulution < 0.11){
        alert('더 이상 줄일 수 없습니다.')
        comResoulution = 1.0
    }
    console.log(comResoulution)
    const containerId = document.querySelector('.chart-container:not(.hidden)').id;
    communityAssign(containerId);
    refreshGraph(containerId); // Refresh the graph to apply new colors
});

function refreshGraph(containerId) {
    const renderer = renderers[containerId];
    renderer.setSetting('nodeReducer', (node, data) => {
        const res = { ...data };
        res.label = data.label;
        res.color = data.color;
        res.borderColor = data.borderColor; // Ensure border color is maintained
        return res;
    });

    renderer.setSetting('edgeReducer', (edge, data) => {
        const res = { ...data };
        res.hidden = false;
        return res;
    });

    renderer.refresh();
}



// function updateCommunityNodes(communityNodes, communityBody) {
//     Object.keys(communityNodes).forEach(community => {
//         const row = document.createElement('tr');
//         const communityCell = document.createElement('td');
//         communityCell.textContent = community;
//         const nodesCell = document.createElement('td');
//         nodesCell.textContent = communityNodes[community].join(', ');
//         row.appendChild(communityCell);
//         row.appendChild(nodesCell);
//         communityBody.appendChild(row);
//     });
// }

function showChart(containerId) {
  const containers = document.querySelectorAll('.chart-container');
  containers.forEach(container => {
      if (container.id === containerId) {
          container.classList.remove('hidden');
      } else {
          container.classList.add('hidden');
      }
  });

  const buttons = document.querySelectorAll('#chart button');
  buttons.forEach(button => {
      if (button.id === `button${containerId === 'chart-container1' ? '1' : '2'}`) {
          button.classList.add('active');
      } else {
          button.classList.remove('active');
      }
  });

  // Load CSV data for the selected container
  const suffix = containerId === 'chart-container1' ? 'edges' : 'jaccard';
  const selectedFiles = [];
  const selectedTitleFiles = [];
  const isGameTitleOn = document.getElementById('game-title-on').checked;

  for (const year in (suffix === 'edges' ? yearFiles : jaccardFiles)) {
      if (document.getElementById(`${year}`).checked) {
          selectedFiles.push(suffix === 'edges' ? yearFiles[year] : jaccardFiles[year]);
          if (isGameTitleOn && suffix === 'edges') {
              selectedTitleFiles.push(titleFiles[year]);
          }
      }
  }

  loadMultipleCSVs(selectedFiles.concat(selectedTitleFiles), containerId);
}
