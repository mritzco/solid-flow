import { Component, createEffect, createSignal } from "solid-js";
import { Node, Edge, SolidFlow } from "solid-flow";
import styles from "./styles.module.css";

/**
 * Dynamic Example
 * Tests dynamic node/edge addition and edge rendering fixes
 *
 * Key Tests:
 * 1. Add node - should NOT move existing nodes
 * 2. Add edge - should update immediately (tests edge rendering fix)
 * 3. Change edges without changing node count - should render (tests reactivity fix)
 */

const Dynamic: Component = () => {
    let nextNodeId = 4; // Counter for new node IDs

    const initialNodes: Node[] = [
        {
            id: "node-1",
            position: { x: 100, y: 100 },
            data: {
                content: <p style={{ margin: "8px" }}>Node 1<br/>(2 outputs)</p>,
            },
            inputs: 1,
            outputs: 2,
        },
        {
            id: "node-2",
            position: { x: 400, y: 50 },
            data: {
                content: <p style={{ margin: "8px" }}>Node 2<br/>(1 output)</p>,
            },
            inputs: 1,
            outputs: 1,
        },
        {
            id: "node-3",
            position: { x: 400, y: 200 },
            data: {
                content: <p style={{ margin: "8px" }}>Node 3<br/>(2 in, 2 out)</p>,
            },
            inputs: 2,
            outputs: 2,
        },
    ];

    const initialEdges: Edge[] = [
        {
            id: "edge_node-1:0_node-2:0",
            sourceNode: "node-1",
            sourceOutput: 0,
            targetNode: "node-2",
            targetInput: 0,
        },
    ];

    const [nodes, setNodes] = createSignal<Node[]>(initialNodes);
    const [edges, setEdges] = createSignal<Edge[]>(initialEdges);

    // Debug logging
    createEffect(() => {
        console.log("=== Dynamic Example State ===");
        console.log("Nodes:", nodes().length);
        console.log("Edges:", edges().length);
        nodes().forEach(n => {
            console.log(`  ${n.id}: position (${n.position.x}, ${n.position.y})`);
        });
        edges().forEach(e => {
            console.log(`  ${e.id}: ${e.sourceNode}:${e.sourceOutput} → ${e.targetNode}:${e.targetInput}`);
        });
    });

    // Test 1: Add a new node WITHOUT moving existing ones
    const handleAddNode = () => {
        const newNode: Node = {
            id: `node-${nextNodeId}`,
            position: { x: 700, y: 100 + (nextNodeId - 4) * 100 }, // Position to the right
            data: {
                content: (
                    <div style={{ margin: "8px" }}>
                        <p style={{ margin: "0", "font-weight": "bold" }}>Node {nextNodeId}</p>
                        <p style={{ margin: "4px 0 0 0", "font-size": "11px", color: "#666" }}>
                            Just added
                        </p>
                    </div>
                ),
            },
            inputs: 2,
            outputs: 2,
        };

        console.log(`[ADD NODE] Adding ${newNode.id} at (${newNode.position.x}, ${newNode.position.y})`);
        console.log("[ADD NODE] Existing positions BEFORE:", nodes().map(n => ({ id: n.id, pos: n.position })));

        // Create NEW array (critical for reactivity)
        setNodes([...nodes(), newNode]);
        nextNodeId++;

        console.log("[ADD NODE] Existing positions AFTER:", nodes().map(n => ({ id: n.id, pos: n.position })));
        console.log("[ADD NODE] Test: Check if existing nodes stayed in place");
    };

    // Test 2: Add edge - tests edge rendering fix (same node count, different edges)
    const handleAddEdge = () => {
        const currentNodes = nodes();
        const currentEdges = edges();

        // Find node-1 and node-3 (or any two nodes)
        const sourceNode = currentNodes.find(n => n.id === "node-1");
        const targetNode = currentNodes.find(n => n.id === "node-3");

        if (!sourceNode || !targetNode) {
            console.warn("[ADD EDGE] Nodes not found");
            return;
        }

        // Check if edge already exists
        const edgeId = `edge_node-1:1_node-3:0`;
        if (currentEdges.some(e => e.id === edgeId)) {
            console.log("[ADD EDGE] Edge already exists, removing it");
            setEdges(currentEdges.filter(e => e.id !== edgeId));
            return;
        }

        const newEdge: Edge = {
            id: edgeId,
            sourceNode: "node-1",
            sourceOutput: 1, // Second output of node-1
            targetNode: "node-3",
            targetInput: 0, // First input of node-3
        };

        console.log("[ADD EDGE] Adding edge:", edgeId);
        console.log("[ADD EDGE] Node count stays same:", currentNodes.length);
        console.log("[ADD EDGE] Test: Edge should render immediately (tests reactivity fix)");

        // Create NEW array (critical for reactivity)
        setEdges([...currentEdges, newEdge]);
    };

    // Test 3: Cycle through different edge configurations
    let edgeConfigIndex = 0;
    const edgeConfigs: Edge[][] = [
        // Config 0: Initial (node-1 → node-2)
        [
            {
                id: "edge_node-1:0_node-2:0",
                sourceNode: "node-1",
                sourceOutput: 0,
                targetNode: "node-2",
                targetInput: 0,
            },
        ],
        // Config 1: Different target (node-2 → node-3)
        [
            {
                id: "edge_node-2:0_node-3:0",
                sourceNode: "node-2",
                sourceOutput: 0,
                targetNode: "node-3",
                targetInput: 0,
            },
        ],
        // Config 2: Chain (node-1 → node-2 → node-3)
        [
            {
                id: "edge_node-1:0_node-2:0",
                sourceNode: "node-1",
                sourceOutput: 0,
                targetNode: "node-2",
                targetInput: 0,
            },
            {
                id: "edge_node-2:0_node-3:0",
                sourceNode: "node-2",
                sourceOutput: 0,
                targetNode: "node-3",
                targetInput: 0,
            },
        ],
        // Config 3: Fork (node-1 → both node-2 and node-3)
        [
            {
                id: "edge_node-1:0_node-2:0",
                sourceNode: "node-1",
                sourceOutput: 0,
                targetNode: "node-2",
                targetInput: 0,
            },
            {
                id: "edge_node-1:1_node-3:0",
                sourceNode: "node-1",
                sourceOutput: 1,
                targetNode: "node-3",
                targetInput: 0,
            },
        ],
        // Config 4: No edges (empty)
        [],
    ];

    const handleSwapEdges = () => {
        const currentNodes = nodes();
        console.log("[SWAP EDGES] Node count:", currentNodes.length);

        // Cycle to next configuration
        edgeConfigIndex = (edgeConfigIndex + 1) % edgeConfigs.length;
        const newEdges = edgeConfigs[edgeConfigIndex];

        console.log(`[SWAP EDGES] Switching to config ${edgeConfigIndex}:`,
            newEdges.length === 0 ? "NO EDGES" :
            newEdges.map(e => `${e.sourceNode}→${e.targetNode}`).join(", ")
        );
        console.log("[SWAP EDGES] Test: Edges should update even though node count unchanged");

        setEdges([...newEdges]);
    };

    // Reset to initial state
    const handleReset = () => {
        console.log("[RESET] Resetting to initial state");
        nextNodeId = 4;
        edgeConfigIndex = 0;
        setNodes([...initialNodes]); // Fresh arrays
        setEdges([...initialEdges]);
    };

    return (
        <div class={styles.container}>
            {/* Control Panel */}
            <div class={styles.controls}>
                <div class={styles.controlGroup}>
                    <h3 class={styles.title}>Dynamic Node/Edge Tests</h3>
                    <p class={styles.description}>
                        Tests edge rendering fix and dynamic updates
                    </p>
                </div>

                <div class={styles.controlGroup}>
                    <button class={styles.buttonPrimary} onClick={handleAddNode}>
                        ➕ Add Node
                    </button>
                    <span class={styles.hint}>Should NOT move existing nodes</span>
                </div>

                <div class={styles.controlGroup}>
                    <button class={styles.buttonSecondary} onClick={handleAddEdge}>
                        🔗 Toggle Edge (1→3)
                    </button>
                    <span class={styles.hint}>Tests edge reactivity fix</span>
                </div>

                <div class={styles.controlGroup}>
                    <button class={styles.buttonSecondary} onClick={handleSwapEdges}>
                        🔄 Cycle Edge Configs
                    </button>
                    <span class={styles.hint}>5 configs: single → chain → fork → none</span>
                </div>

                <div class={styles.controlGroup}>
                    <button class={styles.buttonReset} onClick={handleReset}>
                        ↺ Reset
                    </button>
                </div>

                <div class={styles.stats}>
                    <div>Nodes: <strong>{nodes().length}</strong></div>
                    <div>Edges: <strong>{edges().length}</strong></div>
                </div>
            </div>

            {/* Canvas */}
            <div class={styles.main}>
                <SolidFlow
                    nodes={nodes()}
                    edges={edges()}
                    onNodesChange={(newNodes: Node[]) => {
                        console.log("[NODES CHANGED] User moved nodes");
                        setNodes(newNodes);
                    }}
                    onEdgesChange={(newEdges: Edge[]) => {
                        console.log("[EDGES CHANGED] User created/deleted edge");
                        setEdges(newEdges);
                    }}
                    height="100%"
                    width="100%"
                />
            </div>
        </div>
    );
};

export default Dynamic;
