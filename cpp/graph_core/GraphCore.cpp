/**
 * @file GraphCore.cpp
 * @brief 实现图核心对象的同步、统计、调试输出和安全访问逻辑。
 * @author 项目维护者
 * @date 2026-08-26
 */

#include "GraphCore.h"

#include "GraphCoreDebugFormat.h"
#include "GraphCoreJsonReader.h"
#include "GraphCoreResultJson.h"
#include "GraphCoreValidation.h"

#include <exception>
#include <memory>
#include <sstream>
#include <string>
#include <vector>

/**
 * @brief 清空当前图中的全部节点和边。
 * @return 无返回值。
 */
void GraphCore::clear() {
  nodes.clear();
  edges.clear();
}

/**
 * @brief 从 JSON 字符串同步图核心数据，并返回同步结果。
 * @param inputJson 待解析的图核心输入 JSON 字符串。
 * @return 表示同步是否成功、节点数、边数和诊断信息的 JSON 字符串。
 */
std::string GraphCore::syncFromJson(const std::string& inputJson) {
  try {
    GraphCoreInput input = parseGraphCoreInputJson(inputJson);

    const std::vector<std::string> diagnostics = validateGraphCoreInput(input);
    if (!diagnostics.empty()) {
      return makeGraphCoreResultJson(false, nodeCount(), edgeCount(), diagnostics);
    }

    clear();
    nodes.reserve(input.nodes.size());
    edges.reserve(input.edges.size());

    for (const InputNode& inputNode : input.nodes) {
      auto node = std::make_shared<Node>();
      node->node_index = inputNode.node_index;
      node->width = inputNode.width;
      node->height = inputNode.height;
      node->hasAvatar = inputNode.hasAvatar;
      nodes.push_back(node);
    }

    for (const InputEdge& inputEdge : input.edges) {
      auto edge = std::make_shared<Edge>();
      edge->edge_index = inputEdge.edge_index;
      edge->source = inputEdge.source;
      edge->target = inputEdge.target;
      edge->type = inputEdge.type;
      edges.push_back(edge);
    }

    return makeGraphCoreResultJson(true, nodeCount(), edgeCount(), {});
  } catch (const std::exception& error) {
    return makeGraphCoreResultJson(false, nodeCount(), edgeCount(), {error.what()});
  } catch (...) {
    return makeGraphCoreResultJson(false, nodeCount(), edgeCount(), {"unknown GraphCore sync error"});
  }
}

/**
 * @brief 获取当前图中的节点数量。
 * @return 当前节点数量。
 */
int GraphCore::nodeCount() const {
  return static_cast<int>(nodes.size());
}

/**
 * @brief 获取当前图中的边数量。
 * @return 当前边数量。
 */
int GraphCore::edgeCount() const {
  return static_cast<int>(edges.size());
}

/**
 * @brief 生成当前图核心状态的调试文本。
 * @return 当前图核心状态的调试字符串；生成失败时返回错误说明。
 */
std::string GraphCore::debugDump() const {
  try {
    std::ostringstream out;
    out << *this;
    return out.str();
  } catch (const std::exception& error) {
    return std::string("GraphCore debugDump failed: ") + error.what();
  } catch (...) {
    return "GraphCore debugDump failed: unknown error";
  }
}

/**
 * @brief 按节点索引安全获取只读节点对象。
 * @param node_index 待获取的节点索引。
 * @return 节点存在时返回只读节点指针；索引无效时返回空指针。
 */
std::shared_ptr<const Node> GraphCore::getNode(int node_index) const {
  if (node_index < 0 || node_index >= nodeCount()) {
    return nullptr;
  }
  return nodes[static_cast<std::size_t>(node_index)];
}

/**
 * @brief 按边索引安全获取只读边对象。
 * @param edge_index 待获取的边索引。
 * @return 边存在时返回只读边指针；索引无效时返回空指针。
 */
std::shared_ptr<const Edge> GraphCore::getEdge(int edge_index) const {
  if (edge_index < 0 || edge_index >= edgeCount()) {
    return nullptr;
  }
  return edges[static_cast<std::size_t>(edge_index)];
}
