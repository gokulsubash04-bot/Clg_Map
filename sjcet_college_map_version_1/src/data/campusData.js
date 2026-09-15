function generateThreeDigitRooms(prefix, buildingId, floors) {
  const out = []
  const pad2 = (n) => String(n).padStart(2, "0")
  for (const { floor, rooms } of floors) {
    for (let r = 1; r <= rooms; r++) {
      const num = floor === 0 ? `0${pad2(r)}` : `${floor}${pad2(r)}`
      out.push({ id: `${prefix}-${num}`, name: `${prefix}-${num}`, buildingId, floor })
    }
  }
  return out
}

export const nodes = [
  { id: 1, name: "Main Block - SJB", type: "building", pos: [9.7266737171401, 76.72585990264548] },
  { id: 2, name: "Library", type: "building", pos: [9.7272323733, 76.7266628441] },
  { id: 3, name: "SPB", type: "building", pos: [9.7272695253, 76.725929907] },
  { id: 4, name: "MTB", type: "building", pos: [9.727149359063052, 76.72659391614837] },
  { id: 5, name: "SFB", type: "building", pos: [9.728021268238637, 76.7268860120577] },
  { id: 6, name: "Front-Canteen", type: "building", pos: [9.7264902977, 76.7251121764] },
  { id: 7, name: "Main Gate", type: "building", pos: [9.726085557057036, 76.72498213058641] },
  { id: 8, name: "madona_canteen", type: "building", pos: [9.727413418018793, 76.7269813238087] },
  { id: 9, name: "Eienstein hall", type: "building", pos: [9.727748304435945, 76.72645963841953] },
  { id: 10, name: "SJPB", type: "building", pos: [9.726606469003748, 76.72640486371023] },
  { id: 11, name: "Girls hostel", type: "building", pos: [9.728678901211296, 76.72775823874247] },
  { id: 12, name: "Newton block", type: "building", pos: [9.728112623537932, 76.72764084191463] },
  { id: 13, name: "st marys hostel", type: "building", pos: [9.728913273158117, 76.72552202591373] },
  { id: 14, name: "St francis hall", type: "building", pos: [9.728174633747477, 76.72672365393503] },
  { id: 101, name: "Junction 1", type: "junction", pos: [9.726534277748849, 76.72558558981241] },
  { id: 102, name: "Junction 2", type: "junction", pos: [9.727216597456232, 76.72574063792902] },
  { id: 103, name: "Junction 3", type: "junction", pos: [9.72744431945593, 76.72610126172577] },
  { id: 104, name: "Junction 4", type: "junction", pos: [9.727301338984836, 76.72681859528495] },
  { id: 105, name: "Junction 5", type: "junction", pos: [9.726530332470606, 76.72663530250544] },
  { id: 106, name: "Junction 6", type: "junction", pos: [9.726294669898728, 76.72629255506806] },
  { id: 107, name: "Junction 7", type: "junction", pos: [9.726460142272716, 76.72563608815594] },
  { id: 108, name: "Junction 8", type: "junction", pos: [9.726703608727286, 76.72561685920698] },
  { id: 109, name: "Junction 9", type: "junction", pos: [9.726418465486036, 76.72583857322643] },
  { id: 110, name: "Junction 10", type: "junction", pos: [9.726577124875798, 76.72571655786768] },
  { id: 111, name: "Junction 11", type: "junction", pos: [9.726773535256724, 76.7260460451557] },
  { id: 112, name: "Junction 12", type: "junction", pos: [9.72693341913243, 76.72604820498363] },
  { id: 113, name: "Junction 13", type: "junction", pos: [9.727031234166198, 76.72611593075919] },
  { id: 114, name: "Junction 14", type: "junction", pos: [9.727125083698738, 76.72625741728045] },
  { id: 115, name: "Junction 15", type: "junction", pos: [9.72708083475786, 76.72647513676593] },
  { id: 116, name: "Junction 16", type: "junction", pos: [9.726719548419998, 76.72630035036002] },
  { id: 117, name: "Junction 17", type: "junction", pos: [9.726664965402268, 76.7261809101181] },
  { id: 118, name: "Junction 18", type: "junction", pos: [9.72687200196869, 76.72619661308944] },
  { id: 119, name: "Junction 19", type: "junction", pos: [9.72616179603512, 76.72501441612735] },
  { id: 120, name: "Junction 20", type: "junction", pos: [9.726114830140899, 76.72507578417556] },
  { id: 121, name: "Junction 21", type: "junction", pos: [9.726301363192599, 76.7252401102744] },
  { id: 122, name: "Junction 22", type: "junction", pos: [9.7268339433928, 76.72644992156215] },
  { id: 123, name: "Junction 23", type: "junction", pos: [9.726444371049226, 76.72650212592482] },
  { id: 124, name: "Junction 24", type: "junction", pos: [9.727330557802839, 76.72591159908885] },
  { id: 125, name: "Junction 25", type: "junction", pos: [9.72691549125136, 76.72648531531583] },
  { id: 126, name: "Junction 26", type: "junction", pos: [9.726918883645512, 76.7255905448562] },
  { id: 127, name: "Junction 27", type: "junction", pos: [9.727923469134181, 76.726620513052] },
  { id: 128, name: "Junction 28", type: "junction", pos: [9.727830941651087, 76.72675194128432] },
  { id: 129, name: "Junction 29", type: "junction", pos: [9.72770839498665, 76.72680548670799] },
  { id: 130, name: "Junction 30", type: "junction", pos: [9.728363701924051, 76.72736648684399] },
  { id: 131, name: "Junction 31", type: "junction", pos: [9.728512786843579, 76.72718540083234] },
  { id: 132, name: "Junction 32", type: "junction", pos: [9.727954157153274, 76.72691922676484] },
]

export const edges = [
  [101, 108], [108, 126], [126, 102], [108, 110], [110, 109], [109, 107],
  [102, 124], [124, 103], [124, 3], [102, 112], [103, 104], [103, 114],
  [104, 105], [105, 123], [123, 106], [123, 10], [10, 116], [106, 109],
  [117, 106], [113, 118], [116, 118], [115, 118], [111, 112], [112, 113],
  [113, 114], [114, 115], [115, 125], [125, 122], [122, 116], [116, 117],
  [117, 111], [113, 3], [4, 104], [103, 9], [111, 118], [7, 119],
  [119, 121], [121, 101], [121, 6], [107, 120], [120, 7], [115, 4],
  [127, 9], [127, 128], [128, 5], [104, 129], [129, 132], [128, 129],
  [130, 131], [130, 12], [132, 5], [132, 130], [103, 13], [130, 11],
  [101, 107], [110, 1], [1, 111], [5, 14], [2, 104], [8, 104],
]

const ROOM_CONFIGS = [
  { prefix: "Main Block - SJB", buildingId: 1, floors: [{ floor: 0, rooms: 8 }, { floor: 1, rooms: 12 }, { floor: 2, rooms: 20 }, { floor: 3, rooms: 12 }, { floor: 4, rooms: 12 }] },
  { prefix: "SPB", buildingId: 3, floors: [{ floor: 0, rooms: 10 }, { floor: 1, rooms: 9 }, { floor: 2, rooms: 8 }] },
  { prefix: "MTB", buildingId: 4, floors: [{ floor: 0, rooms: 8 }, { floor: 1, rooms: 12 }, { floor: 3, rooms: 12 }, { floor: 4, rooms: 12 }] },
  { prefix: "SFB", buildingId: 5, floors: [{ floor: 0, rooms: 8 }, { floor: 1, rooms: 12 }, { floor: 3, rooms: 12 }, { floor: 4, rooms: 12 }] },
  { prefix: "SJPB", buildingId: 10, floors: [{ floor: 0, rooms: 8 }, { floor: 1, rooms: 12 }, { floor: 3, rooms: 12 }, { floor: 4, rooms: 12 }] },
  { prefix: "Newton block", buildingId: 12, floors: [{ floor: 0, rooms: 8 }, { floor: 1, rooms: 12 }, { floor: 3, rooms: 12 }, { floor: 4, rooms: 12 }] },
]

export const rooms = ROOM_CONFIGS.flatMap((c) => generateThreeDigitRooms(c.prefix, c.buildingId, c.floors))
