/**
 * @file GraphCore.h
 * @brief 声明图核心数据结构、输入结构和图核心访问接口。
 * @author 项目维护者
 * @date 2026-08-26
 */

#pragma once

#include <memory>
#include <ostream>
#include <string>
#include <vector>

/**
 * @enum EdgeType
 * @brief 表示图中边的关系类型。
 */
enum class EdgeType {
  /** @brief 父子关系边。 */
  Parent = 0,
  /** @brief 配偶关系边。 */
  Spouse = 1,
};

/**
 * @class Node
 * @brief 表示图核心中的节点数据。
 */
class Node {
public:
  /** @brief 节点在输入数组中的索引。 */
  int node_index = -1;
  /** @brief 节点宽度。 */
  double width = 0;
  /** @brief 节点高度。 */
  double height = 0;
  /** @brief 标记节点是否包含头像。 */
  bool hasAvatar = false;
};

/**
 * @class Edge
 * @brief 表示图核心中的边数据。
 */
class Edge {
public:
  /** @brief 边在输入数组中的索引。 */
  int edge_index = -1;
  /** @brief 起始节点索引。 */
  int source = -1;
  /** @brief 目标节点索引。 */
  int target = -1;
  /** @brief 边的关系类型。 */
  EdgeType type = EdgeType::Parent;
};

/**
 * @class InputNode
 * @brief 表示从外部输入解析得到的节点数据。
 */
class InputNode {
public:
  /** @brief 输入节点在数组中的索引。 */
  int node_index = -1;
  /** @brief 输入节点宽度。 */
  double width = 0;
  /** @brief 输入节点高度。 */
  double height = 0;
  /** @brief 标记输入节点是否包含头像。 */
  bool hasAvatar = false;
};

/**
 * @class InputEdge
 * @brief 表示从外部输入解析得到的边数据。
 */
class InputEdge {
public:
  /** @brief 输入边在数组中的索引。 */
  int edge_index = -1;
  /** @brief 输入边的起始节点索引。 */
  int source = -1;
  /** @brief 输入边的目标节点索引。 */
  int target = -1;
  /** @brief 输入边的关系类型。 */
  EdgeType type = EdgeType::Parent;
};

/**
 * @class GraphCoreInput
 * @brief 表示同步图核心所需的完整输入数据。
 */
class GraphCoreInput {
public:
  /** @brief 待同步的节点列表。 */
  std::vector<InputNode> nodes;
  /** @brief 待同步的边列表。 */
  std::vector<InputEdge> edges;
};

/**
 * @class GraphCore
 * @brief 管理图核心节点、边以及相关查询和调试能力。
 */
class GraphCore {
public:
  /** @brief 当前图中的节点列表。 */
  std::vector<std::shared_ptr<Node>> nodes;
  /** @brief 当前图中的边列表。 */
  std::vector<std::shared_ptr<Edge>> edges;

  /**
   * @brief 清空当前图中的全部节点和边。
   * @return 无返回值。
   */
  void clear();

  /**
   * @brief 从 JSON 字符串同步图核心数据，并返回同步结果。
   * @param inputJson 待解析的图核心输入 JSON 字符串。
   * @return 表示同步是否成功、节点数、边数和诊断信息的 JSON 字符串。
   */
  std::string syncFromJson(const std::string& inputJson);

  /**
   * @brief 获取当前图中的节点数量。
   * @return 当前节点数量。
   */
  int nodeCount() const;

  /**
   * @brief 获取当前图中的边数量。
   * @return 当前边数量。
   */
  int edgeCount() const;

  /**
   * @brief 生成当前图核心状态的调试文本。
   * @return 当前图核心状态的调试字符串；生成失败时返回错误说明。
   */
  std::string debugDump() const;

  /**
   * @brief 按节点索引安全获取只读节点对象。
   * @param node_index 待获取的节点索引。
   * @return 节点存在时返回只读节点指针；索引无效时返回空指针。
   */
  std::shared_ptr<const Node> getNode(int node_index) const;

  /**
   * @brief 按边索引安全获取只读边对象。
   * @param edge_index 待获取的边索引。
   * @return 边存在时返回只读边指针；索引无效时返回空指针。
   */
  std::shared_ptr<const Edge> getEdge(int edge_index) const;
};

/**
 * @brief 将边类型写入输出流。
 * @param out 目标输出流。
 * @param type 待写入的边类型。
 * @return 写入后的输出流引用。
 */
std::ostream& operator<<(std::ostream& out, EdgeType type);

/**
 * @brief 将节点信息写入输出流。
 * @param out 目标输出流。
 * @param node 待写入的节点对象。
 * @return 写入后的输出流引用。
 */
std::ostream& operator<<(std::ostream& out, const Node& node);

/**
 * @brief 将边信息写入输出流。
 * @param out 目标输出流。
 * @param edge 待写入的边对象。
 * @return 写入后的输出流引用。
 */
std::ostream& operator<<(std::ostream& out, const Edge& edge);

/**
 * @brief 将图核心摘要和明细写入输出流。
 * @param out 目标输出流。
 * @param graphCore 待写入的图核心对象。
 * @return 写入后的输出流引用。
 */
std::ostream& operator<<(std::ostream& out, const GraphCore& graphCore);
