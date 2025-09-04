const fs = require('fs');
const path = require('path');

// Small venue configuration - same structure, smaller numbers
const SMALL_CONFIG = {
  seatSpacing: 35, // Consistent spacing between seats
  sectionGap: 50,  // Consistent gap between sections
  mapWidth: 1024,
  mapHeight: 768,
  sections: [
    // Lower Bowl sections
    { id: 'A', label: 'Lower Bowl A', priceTier: 1, rows: 15, seatsPerRow: 20 },
    { id: 'B', label: 'Lower Bowl B', priceTier: 1, rows: 15, seatsPerRow: 20 },
    { id: 'C', label: 'Lower Bowl C', priceTier: 1, rows: 15, seatsPerRow: 20 },
    { id: 'D', label: 'Lower Bowl D', priceTier: 1, rows: 15, seatsPerRow: 20 },

    // Upper Bowl sections
    { id: 'E', label: 'Upper Bowl A', priceTier: 2, rows: 10, seatsPerRow: 25 },
    { id: 'F', label: 'Upper Bowl B', priceTier: 2, rows: 10, seatsPerRow: 25 },

    // Premium sections
    { id: 'G', label: 'Premium A', priceTier: 3, rows: 8, seatsPerRow: 15 },
    { id: 'H', label: 'Premium B', priceTier: 3, rows: 8, seatsPerRow: 15 }
  ]
};

// Dynamic positioning calculator (same as main venue)
function calculateSectionPositions(sections, seatSpacing, sectionGap) {
  const positionedSections = [];
  let currentY = 0;
  let currentX = 0;
  let maxHeightInRow = 0;

  // Group sections by rows (2 sections per row)
  for (let i = 0; i < sections.length; i += 2) {
    const section1 = sections[i];
    const section2 = sections[i + 1];

    // Calculate section dimensions
    const section1Width = section1.seatsPerRow * seatSpacing;
    const section1Height = section1.rows * seatSpacing;

    // Position first section in the row
    const positionedSection1 = {
      ...section1,
      x: currentX,
      y: currentY
    };
    positionedSections.push(positionedSection1);

    // Position second section if it exists
    if (section2) {
      const section2Width = section2.seatsPerRow * seatSpacing;
      const section2Height = section2.rows * seatSpacing;

      const positionedSection2 = {
        ...section2,
        x: currentX + section1Width + sectionGap,
        y: currentY
      };
      positionedSections.push(positionedSection2);

      // Update max height for this row
      maxHeightInRow = Math.max(section1Height, section2Height);
    } else {
      // Only one section in this row
      maxHeightInRow = section1Height;
    }

    // Move to next row
    currentY += maxHeightInRow + sectionGap;
  }

  return positionedSections;
}

function generateSeatId(sectionId, rowIndex, col) {
  return `${sectionId}-${rowIndex}-${col.toString().padStart(2, '0')}`;
}

function generateSeatStatus() {
  const rand = Math.random();
  if (rand < 0.7) return 'available';
  if (rand < 0.85) return 'sold';
  if (rand < 0.95) return 'reserved';
  return 'held';
}

function generateSection(sectionConfig) {
  const rows = [];
  const seatSpacing = SMALL_CONFIG.seatSpacing;

  for (let rowIndex = 1; rowIndex <= sectionConfig.rows; rowIndex++) {
    const seats = [];

    for (let col = 1; col <= sectionConfig.seatsPerRow; col++) {
      const seat = {
        id: generateSeatId(sectionConfig.id, rowIndex, col),
        col: col,
        x: (col - 1) * seatSpacing,
        y: (rowIndex - 1) * seatSpacing,
        priceTier: sectionConfig.priceTier,
        status: generateSeatStatus()
      };
      seats.push(seat);
    }

    rows.push({
      index: rowIndex,
      seats: seats
    });
  }

  return {
    id: sectionConfig.id,
    label: sectionConfig.label,
    transform: {
      x: sectionConfig.x,
      y: sectionConfig.y,
      scale: 1
    },
    rows: rows
  };
}

function generateSmallVenue() {
  // Calculate positions dynamically
  const positionedSections = calculateSectionPositions(
    SMALL_CONFIG.sections,
    SMALL_CONFIG.seatSpacing,
    SMALL_CONFIG.sectionGap
  );

  const sections = positionedSections.map(generateSection);

  const venue = {
    venueId: "arena-01",
    name: "Metropolis Arena",
    map: {
      width: SMALL_CONFIG.mapWidth,
      height: SMALL_CONFIG.mapHeight
    },
    sections: sections
  };

  return venue;
}

function main() {
  console.log('Generating small test venue...');

  const venue = generateSmallVenue();

  // Write to public/venue.json
  const outputPath = path.join(__dirname, '..', 'public', 'venue.json');
  fs.writeFileSync(outputPath, JSON.stringify(venue, null, 2));

  console.log(`Venue data written to ${outputPath}`);
  console.log(`Total sections: ${venue.sections.length}`);
  console.log(`Map dimensions: ${venue.map.width}x${venue.map.height}`);

  // Print seat count by section
  venue.sections.forEach(section => {
    const seatCount = section.rows.reduce((total, row) => total + row.seats.length, 0);
    console.log(`${section.label}: ${seatCount} seats`);
  });
}

if (require.main === module) {
  main();
}

module.exports = { generateSmallVenue, SMALL_CONFIG };
