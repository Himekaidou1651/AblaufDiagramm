/**
 * @file GraphCoreValidation.cpp
 * @brief 实现图核心输入数据的索引和尺寸校验逻辑。
 * @author 项目维护者
 * @date 2026-08-26
 */

#include "GraphCoreValidation.h"

#include <string>
#include <vector>

/**
 * @brief 校验图核心输入数据的索引和尺寸约束。
 * @param input 待校验的图核心输入数据。
 * @return 校验过程中产生的诊断信息列表；为空表示校验通过。
 */
std::vector<std::string> validateGraphCoreInput(const GraphCoreInput& input) {
  std::vector<std::string> diagnostics;

  for (std::size_t i = 0; i < input.nodes.size(); ++i) {
    const InputNode& node = input.nodes[i];
    if (node.node_index < 0) {
      diagnostics.push_back("nodes[" + std::to_string(i) + "].node_index must be >= 0");
    }
    if (node.node_index != static_cast<int>(i)) {
      diagnostics.push_back("nodes[" + std::to_string(i) + "].node_index must equal its array index");
    }
    if (node.width <= 0) {
      diagnostics.push_back("nodes[" + std::to_string(i) + "].width must be > 0");
    }
    if (node.height <= 0) {
      diagnostics.push_back("nodes[" + std::to_string(i) + "].height must be > 0");
    }
  }

  for (std::size_t i = 0; i < input.edges.size(); ++i) {
    const InputEdge& edge = input.edges[i];
    if (edge.edge_index < 0) {
      diagnostics.push_back("edges[" + std::to_string(i) + "].edge_index must be >= 0");
    }
    if (edge.edge_index != static_cast<int>(i)) {
      diagnostics.push_back("edges[" + std::to_string(i) + "].edge_index must equal its array index");
    }
    if (edge.source < 0 || edge.source >= static_cast<int>(input.nodes.size())) {
      diagnostics.push_back("edges[" + std::to_string(i) + "].source is out of range");
    }
    if (edge.target < 0 || edge.target >= static_cast<int>(input.nodes.size())) {
      diagnostics.push_back("edges[" + std::to_string(i) + "].target is out of range");
    }
  }

  return diagnostics;
}
