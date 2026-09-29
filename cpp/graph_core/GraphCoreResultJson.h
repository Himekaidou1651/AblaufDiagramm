/**
 * @file GraphCoreResultJson.h
 * @brief 声明图核心同步结果 JSON 生成接口。
 * @author 项目维护者
 * @date 2026-08-26
 */

#pragma once

#include <string>
#include <vector>

/**
 * @brief 生成图核心同步结果 JSON 字符串。
 * @param ok 标记同步是否成功。
 * @param nodeCount 当前节点数量。
 * @param edgeCount 当前边数量。
 * @param diagnostics 同步过程中产生的诊断信息列表。
 * @return 表示同步结果的 JSON 字符串。
 */
std::string makeGraphCoreResultJson(
  bool ok,
  int nodeCount,
  int edgeCount,
  const std::vector<std::string>& diagnostics
);
