/**
 * @file GraphCoreJsonReader.h
 * @brief 声明图核心输入 JSON 解析接口。
 * @author 项目维护者
 * @date 2026-08-26
 */

#pragma once

#include "GraphCore.h"

#include <string>

/**
 * @brief 解析图核心输入 JSON 字符串。
 * @param source 待解析的 JSON 源字符串。
 * @return 解析后的图核心输入数据。
 */
GraphCoreInput parseGraphCoreInputJson(const std::string& source);
