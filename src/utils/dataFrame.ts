/**
 * A lightweight DataFrame implementation in TypeScript, mimicking key features of Pandas.
 */
export class DataFrame {
  columns: string[];
  data: Record<string, any>[];

  constructor(data: Record<string, any>[]) {
    this.data = data;
    this.columns = data.length > 0 ? Object.keys(data[0]) : [];
  }

  /**
   * Filter rows based on a predicate (like df[df['col'] == val])
   */
  filter(predicate: (row: Record<string, any>) => boolean): DataFrame {
    return new DataFrame(this.data.filter(predicate));
  }

  /**
   * Select specific columns (like df[['col1', 'col2']])
   */
  select(cols: string[]): DataFrame {
    const selected = this.data.map(row => {
      const newRow: Record<string, any> = {};
      cols.forEach(c => {
        newRow[c] = row[c];
      });
      return newRow;
    });
    return new DataFrame(selected);
  }

  /**
   * Get unique values in a column
   */
  unique(column: string): any[] {
    return Array.from(new Set(this.data.map(row => row[column])));
  }

  /**
   * Group by one or more columns
   */
  groupby(byColumns: string | string[]) {
    const cols = Array.isArray(byColumns) ? byColumns : [byColumns];
    const groups: Record<string, Record<string, any>[]> = {};

    this.data.forEach(row => {
      const key = cols.map(c => String(row[c])).join('::');
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(row);
    });

    return {
      /**
       * Aggregate grouped data (e.g., sum, mean, count)
       */
      agg: (aggregations: Record<string, 'sum' | 'mean' | 'count' | 'max' | 'min'>) => {
        const result: Record<string, any>[] = [];

        Object.entries(groups).forEach(([key, rows]) => {
          const keyParts = key.split('::');
          const aggRow: Record<string, any> = {};
          
          // Add back grouping keys
          cols.forEach((col, idx) => {
            aggRow[col] = keyParts[idx];
          });

          // Perform aggregations
          Object.entries(aggregations).forEach(([col, aggType]) => {
            const values = rows.map(r => r[col]).filter(v => typeof v === 'number');

            if (aggType === 'count') {
              aggRow[col] = rows.length;
            } else if (values.length === 0) {
              aggRow[col] = null;
            } else {
              switch (aggType) {
                case 'sum':
                  aggRow[col] = values.reduce((sum, v) => sum + v, 0);
                  break;
                case 'mean':
                  aggRow[col] = values.reduce((sum, v) => sum + v, 0) / values.length;
                  break;
                case 'max':
                  aggRow[col] = Math.max(...values);
                  break;
                case 'min':
                  aggRow[col] = Math.min(...values);
                  break;
              }
            }
          });

          result.push(aggRow);
        });

        return new DataFrame(result);
      }
    };
  }

  /**
   * Calculate descriptive statistics (like df.describe())
   */
  describe(numericCols?: string[]): Record<string, Record<string, number>> {
    const cols = numericCols || this.columns.filter(c => 
      this.data.length > 0 && typeof this.data[0][c] === 'number'
    );

    const stats: Record<string, Record<string, number>> = {};

    cols.forEach(col => {
      const values = this.data.map(row => row[col]).filter(v => typeof v === 'number') as number[];
      if (values.length === 0) return;

      values.sort((a, b) => a - b);
      const count = values.length;
      const sum = values.reduce((s, v) => s + v, 0);
      const mean = sum / count;
      
      const variance = values.reduce((vSum, v) => vSum + Math.pow(v - mean, 2), 0) / count;
      const std = Math.sqrt(variance);

      stats[col] = {
        count,
        mean: Math.round(mean * 100) / 100,
        std: Math.round(std * 100) / 100,
        min: values[0],
        25: values[Math.floor(count * 0.25)],
        50: values[Math.floor(count * 0.50)], // median
        75: values[Math.floor(count * 0.75)],
        max: values[count - 1]
      };
    });

    return stats;
  }

  /**
   * Pivot Table representation
   */
  pivot_table(index: string, columns: string, values: string, aggfunc: 'mean' | 'sum' | 'count' = 'mean'): DataFrame {
    const indexValues = this.unique(index);
    const colValues = this.unique(columns);

    const pivotData = indexValues.map(idxVal => {
      const row: Record<string, any> = { [index]: idxVal };
      
      colValues.forEach(colVal => {
        const filtered = this.data.filter(r => r[index] === idxVal && r[columns] === colVal);
        const valList = filtered.map(r => r[values]).filter(v => typeof v === 'number') as number[];

        if (aggfunc === 'count') {
          row[colVal] = filtered.length;
        } else if (valList.length === 0) {
          row[colVal] = 0;
        } else {
          const sum = valList.reduce((s, v) => s + v, 0);
          row[colVal] = aggfunc === 'sum' ? sum : sum / valList.length;
        }
      });

      return row;
    });

    return new DataFrame(pivotData);
  }

  /**
   * Pearson correlation matrix for numeric columns (like df.corr())
   */
  corr(numericCols?: string[]): DataFrame {
    const cols = numericCols || this.columns.filter(c => 
      this.data.length > 0 && typeof this.data[0][c] === 'number'
    );

    const corrData: Record<string, any>[] = [];

    cols.forEach(rowCol => {
      const rowVal: Record<string, any> = { variable: rowCol };
      
      cols.forEach(colCol => {
        const x = this.data.map(r => r[rowCol]).filter(v => typeof v === 'number') as number[];
        const y = this.data.map(r => r[colCol]).filter(v => typeof v === 'number') as number[];

        if (x.length !== y.length || x.length === 0) {
          rowVal[colCol] = 0;
          return;
        }

        const n = x.length;
        const sumX = x.reduce((s, v) => s + v, 0);
        const sumY = y.reduce((s, v) => s + v, 0);
        const sumXY = x.reduce((s, v, i) => s + v * y[i], 0);
        const sumX2 = x.reduce((s, v) => s + v * v, 0);
        const sumY2 = y.reduce((s, v) => s + v * v, 0);

        const numerator = n * sumXY - sumX * sumY;
        const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

        rowVal[colCol] = denominator === 0 ? 0 : Math.round((numerator / denominator) * 100) / 100;
      });

      corrData.push(rowVal);
    });

    return new DataFrame(corrData);
  }
}
