import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    console.log("[Demo Results] Returning static warehouse analysis data")

    const staticResults = {
      id: "demo-job",
      status: "completed",
      filename: "warehouse-video.mp4",
      uploadedAt: new Date().toISOString(),
      results: {
        incorrectParking: true,
        wasteMaterial: true,
        explanation: "Comprehensive analysis of 12 unique frames using combined computer vision and AI grid-based analysis. Multiple safety violations detected including vehicle parking issues and debris accumulation that could obstruct emergency vehicle access.",
        frames: [
          { "time": "00:00", "imageUrl": "/warehouse-frames/frame_0_00m00s.jpg", "boundingBoxes": [] },
          { "time": "00:01", "imageUrl": "/warehouse-frames/frame_12_00m14s.jpg", "boundingBoxes": [] },
          { "time": "00:02", "imageUrl": "/warehouse-frames/frame_14_00m16s.jpg", "boundingBoxes": [] },
          { "time": "00:03", "imageUrl": "/warehouse-frames/frame_16_00m21s.jpg", "boundingBoxes": [] },
          { "time": "00:04", "imageUrl": "/warehouse-frames/frame_1_00m06s.jpg", "boundingBoxes": [] },
          { "time": "00:05", "imageUrl": "/warehouse-frames/frame_23_00m46s.jpg", "boundingBoxes": [] },
          { "time": "00:06", "imageUrl": "/warehouse-frames/frame_30_01m00s.jpg", "boundingBoxes": [] },
          { "time": "00:07", "imageUrl": "/warehouse-frames/frame_39_00m41s.jpg", "boundingBoxes": [] },
          { "time": "00:08", "imageUrl": "/warehouse-frames/frame_40_00m42s.jpg", "boundingBoxes": [] },
          { "time": "00:09", "imageUrl": "/warehouse-frames/frame_50_00m52s.jpg", "boundingBoxes": [] },
          { "time": "00:10", "imageUrl": "/warehouse-frames/frame_61_01m11s.jpg", "boundingBoxes": [] },
          { "time": "00:11", "imageUrl": "/warehouse-frames/frame_6_00m34s.jpg", "boundingBoxes": [] }
        ],
        frameDetails: [
          {
            "frameIndex": 0, "timestamp": "00:00",
            "detailedObservations": "The image shows two large warehouse buildings with metal roofs. There are trees and vegetation visible along the bottom edge of the image. The area between the buildings appears clear, with no visible obstructions.",
            "safetyIssues": [],
            "pathwayClearance": "The pathway between the buildings is clear, with no visible obstructions.",
            "emergencyAccess": "Emergency vehicle access appears unobstructed."
          },
          {
            "frameIndex": 1, "timestamp": "00:01",
            "detailedObservations": "This frame shows a continuation of the warehouse rooftops. There is a narrow pathway between the buildings, which appears clear. Trees are visible along the pathway.",
            "safetyIssues": [],
            "pathwayClearance": "The pathway is narrow but clear, allowing for emergency access.",
            "emergencyAccess": "Emergency vehicle access is possible through the clear pathway."
          },
          {
            "frameIndex": 2, "timestamp": "00:02",
            "detailedObservations": "The image shows the end of the warehouse buildings with a clear pathway between them. There is a vehicle visible at the bottom right corner.",
            "safetyIssues": [{ "type": "vehicle", "severity": "low", "description": "A truck is visible at the bottom right corner, which could obstruct pathways if not parked properly.", "location": "bottom right corner", "impact": "Could hinder emergency vehicle access if parked incorrectly." }],
            "pathwayClearance": "The pathway is clear, but the truck's position should be monitored.",
            "emergencyAccess": "Emergency access is currently unobstructed, but the truck's position should be checked."
          },
          {
            "frameIndex": 3, "timestamp": "00:03",
            "detailedObservations": "The image shows a row of trucks parked alongside a warehouse. Some trucks are covered with tarps, and there is a visible tree on the right side.",
            "safetyIssues": [{ "type": "parking", "severity": "medium", "description": "Trucks parked in a manner that may obstruct emergency vehicle access.", "location": "right side", "impact": "Could delay emergency response times." }],
            "pathwayClearance": "Pathway appears narrow due to parked trucks.",
            "emergencyAccess": "Limited due to vehicle positioning."
          },
          {
            "frameIndex": 4, "timestamp": "00:04",
            "detailedObservations": "A narrow alley between two warehouse buildings with visible debris and vegetation.",
            "safetyIssues": [{ "type": "debris", "severity": "high", "description": "Accumulation of debris in the alleyway.", "location": "center", "impact": "Could hinder emergency personnel movement." }],
            "pathwayClearance": "Pathway is obstructed by debris.",
            "emergencyAccess": "Severely limited due to debris."
          },
          {
            "frameIndex": 5, "timestamp": "00:05",
            "detailedObservations": "An overview of a warehouse area with visible machinery, debris, and vegetation.",
            "safetyIssues": [{ "type": "waste", "severity": "high", "description": "Scattered debris and waste material.", "location": "center", "impact": "Could impede emergency response and personnel movement." }],
            "pathwayClearance": "Pathways are obstructed by debris.",
            "emergencyAccess": "Compromised due to scattered debris."
          },
          {
            "frameIndex": 6, "timestamp": "00:06",
            "detailedObservations": "The area is cluttered with debris and construction materials. There is a significant amount of rubble and waste material scattered across the ground. Trees and vegetation are visible, potentially obstructing pathways.",
            "safetyIssues": [{ "type": "waste", "severity": "high", "description": "Debris and rubble scattered across the ground.", "location": "left side", "impact": "Could impede emergency response and evacuation." }],
            "pathwayClearance": "Pathways are obstructed by debris.",
            "emergencyAccess": "Limited due to debris obstruction."
          },
          {
            "frameIndex": 7, "timestamp": "00:07",
            "detailedObservations": "Heavy machinery and equipment are parked along the right side. Debris is still visible on the left side. The area appears congested with equipment.",
            "safetyIssues": [{ "type": "obstruction", "severity": "medium", "description": "Machinery parked along the right side.", "location": "right side", "impact": "Could delay emergency response." }],
            "pathwayClearance": "Pathways are partially obstructed by machinery.",
            "emergencyAccess": "Limited due to machinery placement."
          },
          {
            "frameIndex": 8, "timestamp": "00:08",
            "detailedObservations": "Similar to frame 7, with heavy machinery and debris visible. The area remains congested with equipment.",
            "safetyIssues": [{ "type": "waste", "severity": "high", "description": "Debris and rubble scattered across the ground.", "location": "left side", "impact": "Could impede emergency response and evacuation." }],
            "pathwayClearance": "Pathways are obstructed by debris and machinery.",
            "emergencyAccess": "Limited due to debris and machinery."
          },
          {
            "frameIndex": 9, "timestamp": "00:09",
            "detailedObservations": "The image shows an industrial area with multiple structures and vehicles. There are several large containers and scattered debris visible.",
            "safetyIssues": [{ "type": "obstruction", "severity": "high", "description": "Containers and debris scattered across the area.", "location": "center", "impact": "Could block emergency vehicles and personnel." }],
            "pathwayClearance": "Pathways are partially obstructed by containers and debris.",
            "emergencyAccess": "Limited due to obstructions."
          },
          {
            "frameIndex": 10, "timestamp": "00:10",
            "detailedObservations": "The image shows a closer view of the industrial area with containers and debris. There are also some large cylindrical objects.",
            "safetyIssues": [{ "type": "waste", "severity": "medium", "description": "Waste materials and debris scattered.", "location": "left side", "impact": "Could impede movement and emergency response." }],
            "pathwayClearance": "Pathways are partially blocked by waste materials.",
            "emergencyAccess": "Restricted due to waste accumulation."
          },
          {
            "frameIndex": 11, "timestamp": "00:11",
            "detailedObservations": "The image shows a broader view of the industrial area with multiple vehicles and equipment. There are several parked trucks and machinery.",
            "safetyIssues": [{ "type": "parking", "severity": "high", "description": "Trucks parked in a manner that obstructs pathways.", "location": "right side", "impact": "Could block emergency vehicles and personnel." }],
            "pathwayClearance": "Pathways are obstructed by improperly parked vehicles.",
            "emergencyAccess": "Severely restricted due to parking issues."
          }
        ],
        mitigationStrategies: [
          {
            "type": "vehicle_parking_violation", "severity": "critical", "urgency": "immediate",
            "description": "Multiple vehicles detected blocking emergency access routes",
            "timeline": "Immediate action required within 30 minutes",
            "responsible_party": "Security/Facilities Management"
          },
          {
            "type": "waste_debris_cleanup", "severity": "high", "urgency": "immediate",
            "description": "Significant debris and waste material obstructing pathways",
            "timeline": "Complete cleaning within 2 hours",
            "responsible_party": "Cleaning/Maintenance Staff"
          }
        ]
      }
    }

    return NextResponse.json(staticResults)
  } catch (error) {
    console.error("[Demo Results] Error:", error)
    return NextResponse.json({ error: "Failed to get demo results" }, { status: 500 })
  }
}
