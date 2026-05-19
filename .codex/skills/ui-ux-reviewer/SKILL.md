---
name: network-diagram-designer
description: Create clean, aligned, layered network diagrams with professional ISP/NOC visual standards.
---

# Network Diagram Standards

## Core Principles
- Always prioritize readability over compactness
- Avoid line crossings whenever possible
- Maintain strict alignment between devices
- Use consistent spacing/grid systems
- Keep visual hierarchy obvious

# Layout Rules

## Alignment
- All devices must align to a virtual grid
- Horizontal spacing must be consistent
- Vertical spacing must be consistent
- Labels must align with their respective elements
- Never place devices slightly off-axis

## Layering
Always separate the network into layers:
- Internet / Transit
- Core
- Distribution
- Access
- Client Edge
- Services
- Monitoring

Each layer must:
- stay visually isolated
- maintain consistent Y positioning
- use clear separation spacing

## Flow Design
- Traffic must visually flow:
  left -> right
  or
  top -> bottom

Never mix both directions in the same diagram.

## Connections
- Minimize line crossings
- Prefer 90-degree clean paths
- Avoid diagonal links
- Parallel links should remain parallel
- Use connection grouping whenever possible

## Device Positioning
- Core devices centered
- Distribution symmetrical
- Access blocks grouped by region/site
- Related devices close together

## Visual Consistency
- Same device types = same size
- Same icon style everywhere
- Same font sizes
- Same border radius
- Same connector style

## Labels
- Short and objective
- Consistent naming format
- Avoid overlapping labels
- Interface names should remain readable

## Mini Diagrams
For protocol/flow diagrams:
- Highlight ONLY relevant devices
- Fade irrelevant infrastructure
- Keep maximum simplicity
- Focus on communication path clarity

## ISP Standards
- BGP upstreams at top
- Core routers centralized
- OLT/access separated
- Transport rings visually obvious
- Redundancy must be visually identifiable

## Critical Rule
If the diagram looks visually unbalanced,
reorganize the entire layout before continuing.