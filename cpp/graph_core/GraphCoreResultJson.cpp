/**
 * @file GraphCoreResultJson.cpp
 * @brief 实现图核心同步结果 JSON 字符串生成逻辑。
 * @author 项目维护者
 * @date 2026-08-26
 */

#include "GraphCoreResultJson.h"

#include <sstream>
#include <string>
#include <vector>

namespace {

/**
 * @brief 转义字符串中的 JSON 特殊字符。
 * @param value 待转义的原始字符串。
 * @return 转义后的 JSON 字符串片段。
 */
std::string jsonEscape(const std::string& value) {
  std::string escaped;
  for (const char c : value) {
    switch (c) {
      case '"':
        escaped += "\\\"";
        break;
      case '\\':
        escaped += "\\\\";
        break;
      case '\n':
        escaped += "\\n";
        break;
      case '\r':
        escaped += "\\r";
        break;
      case '\t':
        escaped += "\\t";
        break;
      default:
        escaped.push_back(c);
    }
  }
  return escaped;
}

} // 匿名命名空间

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
) {
  std::ostringstream out;
  out << "{\"ok\":" << (ok ? "true" : "false")
      << ",\"nodeCount\":" << nodeCount
      << ",\"edgeCount\":" << edgeCount
      << ",\"diagnostics\":[";

  for (std::size_t i = 0; i < diagnostics.size(); ++i) {
    if (i > 0) {
      out << ',';
    }
    out << "{\"level\":\"error\",\"message\":\"" << jsonEscape(diagnostics[i]) << "\"}";
  }

  out << "]}";
  return out.str();
}
