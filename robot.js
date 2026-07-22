// ==========================================
// 1. KHỞI TẠO BẢN ĐỒ LÀNG MEADOWFIELD
// ==========================================
// Dữ liệu các con đường trong làng Meadowfield
const roads = [
    "Alice's House-Bob's House", "Alice's House-Cabin",
    "Alice's House-Post Office", "Bob's House-Town Hall",
    "Daria's House-Ernie's House", "Daria's House-Town Hall",
    "Ernie's House-Grete's House", "Grete's House-Farm",
    "Grete's House-Shop", "Marketplace-Farm",
    "Marketplace-Post Office", "Marketplace-Shop",
    "Marketplace-Town Hall", "Shop-Town Hall"
];

function buildGraph(edges) {
    let graph = Object.create(null);
    function addEdge(from, to) {
        if (graph[from] == null) {
            graph[from] = [to];
        } else {
            graph[from].push(to);
        }
    }
    for (let [from, to] of edges.map(r => r.split("-"))) {
        addEdge(from, to);
        addEdge(to, from);
    }
    return graph;
}

const roadGraph = buildGraph(roads);

// ==========================================
// 2. TRẠNG THÁI LÀNG (VILLAGE STATE)
// ==========================================
class VillageState {
    constructor(place, parcels) {
        this.place = place;
        this.parcels = parcels;
    }

    move(destination) {
        if (!roadGraph[this.place].includes(destination)) {
            return this;
        }
        let parcels = this.parcels.map(p => {
            if (p.place != this.place) return p;
            return { place: destination, address: p.address };
        }).filter(p => p.place != p.address);
        return new VillageState(destination, parcels);
    }
}

// Hàm ngẫu nhiên tạo nhiệm vụ
VillageState.random = function (parcelCount = 5) {
    let parcels = [];
    for (let i = 0; i < parcelCount; i++) {
        let address = randomPick(Object.keys(roadGraph));
        let place;
        do {
            place = randomPick(Object.keys(roadGraph));
        } while (place == address);
        parcels.push({ place, address });
    }
    return new VillageState("Post Office", parcels);
};

function randomPick(array) {
    let choice = Math.floor(Math.random() * array.length);
    return array[choice];
}

// ==========================================
// 3. THUẬT TOÁN TÌM ĐƯỜNG NGẮN NHẤT (BFS)
// ==========================================
function findRoute(graph, from, to) {
    let work = [{ at: from, route: [] }];
    let explored = [];
    for (let i = 0; i < work.length; i++) {
        let { at, route } = work[i];
        for (let node of graph[at]) {
            if (node == to) return route.concat(node);
            if (!explored.includes(node)) {
                explored.push(node);
                work.push({ at: node, route: route.concat(node) });
            }
        }
    }
}

// ==========================================
// 4. CÁC ROBOT
// ==========================================

// --- Route Robot (Đi theo lộ trình cố định) ---
const mailRoute = [
    "Alice's House", "Cabin", "Alice's House", "Bob's House",
    "Town Hall", "Daria's House", "Ernie's House",
    "Grete's House", "Shop", "Grete's House", "Farm",
    "Marketplace", "Post Office"
];

function routeRobot(state, memory) {
    if (memory.length == 0) {
        memory = mailRoute;
    }
    return { direction: memory[0], memory: memory.slice(1) };
}

// --- Goal Oriented Robot (Tối ưu đơn giản - Lấy bưu kiện đầu tiên) ---
function goalOrientedRobot({ place, parcels }, route) {
    if (route.length == 0) {
        let parcel = parcels[0];
        if (parcel.place != place) {
            route = findRoute(roadGraph, place, parcel.place);
        } else {
            route = findRoute(roadGraph, place, parcel.address);
        }
    }
    return { direction: route[0], memory: route.slice(1) };
}

// --- Your Robot (Tối ưu nâng cao - Chọn đường ngắn nhất trong TẤT CẢ bưu kiện) ---
function yourRobot({ place, parcels }, route) {
    if (route.length == 0) {
        let routes = parcels.map(parcel => {
            if (parcel.place != place) {
                return {
                    route: findRoute(roadGraph, place, parcel.place),
                    pickUp: true
                };
            } else {
                return {
                    route: findRoute(roadGraph, place, parcel.address),
                    pickUp: false
                };
            }
        });

        function score({ route, pickUp }) {
            return (pickUp ? -0.5 : 0) + route.length;
        }

        route = routes.reduce((a, b) => score(a) < score(b) ? a : b).route;
    }
    return { direction: route[0], memory: route.slice(1) };
}

// ==========================================
// 5. HÀM SO SÁNH (COMPARE ROBOTS)
// ==========================================
function countSteps(state, robot, memory) {
    for (let steps = 0; ; steps++) {
        if (state.parcels.length == 0) return steps;
        let action = robot(state, memory);
        state = state.move(action.direction);
        memory = action.memory;
    }
}

function compareRobots(robot1, memory1, robot2, memory2) {
    let total1 = 0, total2 = 0;
    const NUM_TASKS = 100;

    for (let i = 0; i < NUM_TASKS; i++) {
        let task = VillageState.random();
        total1 += countSteps(task, robot1, memory1);
        total2 += countSteps(task, robot2, memory2);
    }

    console.log(`GoalOrientedRobot trung bình: ${(total1 / NUM_TASKS).toFixed(2)} bước/nhiệm vụ`);
    console.log(`YourRobot          trung bình: ${(total2 / NUM_TASKS).toFixed(2)} bước/nhiệm vụ`);
}

// Thực thi so sánh
compareRobots(goalOrientedRobot, [], yourRobot, []);