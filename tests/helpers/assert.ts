/**
 * @file assert.ts
 * @brief 提供测试断言工具的统一导出和补充断言函数。
 * @author 项目维护者
 * @date 2026-08-26
 */

import { deepStrictEqual, ok, strictEqual } from 'node:assert'

export { deepStrictEqual, ok, strictEqual }

/**
 * @brief 断言两个数字在允许误差范围内近似相等。
 * @param actual 实际数值。
 * @param expected 期望数值。
 * @param tolerance 允许误差。
 * @return 无返回值。
 */
export function approxEqual(actual: number, expected: number, tolerance = 0.0001) {
  ok(
    Math.abs(actual - expected) <= tolerance,
    `expected ${actual} to be within ${tolerance} of ${expected}`
  )
}

/**
 * @brief 断言字符串包含指定片段。
 * @param value 实际字符串。
 * @param expected 期望包含的字符串片段。
 * @return 无返回值。
 */
export function assertIncludes(value: string, expected: string) {
  ok(value.includes(expected), `expected "${value}" to include "${expected}"`)
}
