# IFAF XLSX Processor Test Suite

This test suite validates the IFAFXLSXProcessor class functionality without requiring database interaction.

## Simplified Architecture

The processor has been simplified to:
- **Direct data processing**: Works directly with `TournamentResultsData` without intermediate transformations
- **Hashmap lookups**: Uses `Map` objects for O(1) lookup performance
- **Reduced interfaces**: Eliminated unnecessary `IFAFTransformedData` interface
- **Streamlined flow**: Single transformation from database data to Excel output

## Test Coverage

The test suite covers the following aspects:

1. **Tournament Information**: Verifies that organizer, round type, and participant counts are correctly populated
2. **Participant Data**: Ensures all participants are output correctly with proper age/gender mapping
3. **Row Structure**: Validates empty rows after bowstyle headers and age/gender groups
4. **Styling Consistency**: Checks that participant result rows maintain consistent visual styling
5. **Data Sorting**: Verifies participants are sorted by score (descending) within each group
6. **Edge Cases**: Handles participants with null club values (defaults to "Independent")
7. **Template Preservation**: Ensures all bowstyle headings from the template are preserved

## Mock Data

The test uses hardcoded mock data based on the seed.ts file:

- **IFAF Bow Style Mappings**: All 12 bowstyles (BBC, BBR, BHC, BHR, BL, BU, FSC, FSR, FU, LB, HB, TR)
- **IFAF Age/Gender Mappings**: Senior, Adult, and Junior categories with proper gender splits
- **Tournament Data**: 5 participants across different age groups and equipment categories

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test xlsxProcessor.test.ts
```

## Test Output

Tests create a temporary `test-output.xlsx` file for inspection and automatically clean up after each test run.

## Dependencies

- Jest for test framework
- ExcelJS for Excel file manipulation
- TypeScript for type safety
