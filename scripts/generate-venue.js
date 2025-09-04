const fs = require('fs');
const path = require('path');

// Unified configuration that works for any venue size
const CONFIG = {
  seatSpacing: 35, // Consistent spacing between seats
  sectionGap: 50,  // Consistent gap between sections
  mapWidth: 2048,
  mapHeight: 1536,

  // Section definitions - same structure regardless of size
  sections: [
    // Lower Bowl sections
    { id: 'A', label: 'Lower Bowl A', priceTier: 1, rows: 25, seatsPerRow: 40 },
    { id: 'B', label: 'Lower Bowl B', priceTier: 1, rows: 25, seatsPerRow: 40 },
    { id: 'C', label: 'Lower Bowl C', priceTier: 1, rows: 25, seatsPerRow: 40 },
    { id: 'D', label: 'Lower Bowl D', priceTier: 1, rows: 25, seatsPerRow: 40 },

    // Upper Bowl sections
    { id: 'E', label: 'Upper Bowl A', priceTier: 2, rows: 20, seatsPerRow: 50 },
    { id: 'F', label: 'Upper Bowl B', priceTier: 2, rows: 20, seatsPerRow: 50 },
    { id: 'G', label: 'Upper Bowl C', priceTier: 2, rows: 20, seatsPerRow: 50 },
    { id: 'H', label: 'Upper Bowl D', priceTier: 2, rows: 20, seatsPerRow: 50 },

    // Premium sections
    { id: 'I', label: 'Premium A', priceTier: 3, rows: 15, seatsPerRow: 30 },
    { id: 'J', label: 'Premium B', priceTier: 3, rows: 15, seatsPerRow: 30 },

    // VIP sections
    { id: 'K', label: 'VIP A', priceTier: 4, rows: 10, seatsPerRow: 20 },
    { id: 'L', label: 'VIP B', priceTier: 4, rows: 10, seatsPerRow: 20 }
  ]
};

// Dynamic positioning calculator
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
  const seatSpacing = CONFIG.seatSpacing;

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

function generateVenue() {
  // Calculate positions dynamically
  const positionedSections = calculateSectionPositions(
    CONFIG.sections,
    CONFIG.seatSpacing,
    CONFIG.sectionGap
  );

  const sections = positionedSections.map(generateSection);

  // Calculate total seats
  const totalSeats = sections.reduce((total, section) => {
    return total + section.rows.reduce((rowTotal, row) => {
      return rowTotal + row.seats.length;
    }, 0);
  }, 0);

  console.log(`Generated ${totalSeats} seats across ${sections.length} sections`);

  const venue = {
    venueId: "arena-01",
    name: "Metropolis Arena",
    map: {
      width: CONFIG.mapWidth,
      height: CONFIG.mapHeight
    },
    sections: sections
  };

  return venue;
}

function main() {
  console.log('Generating venue with dynamic positioning...');

  const venue = generateVenue();

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

module.exports = { generateVenue, CONFIG, calculateSectionPositions };
