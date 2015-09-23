#!/usr/bin/env ruby

require 'json'
require 'time'

class StatsParser
  IssueChange = Struct.new(:id, :title, :old_state, :new_state, :time)

  def initialize(file)
    @file = file
    @data = JSON.parse(File.read(@file))
  end

  def process
    grouped_stats = group_changes_by_day
    count_states(grouped_stats)
  end

  private

  def relevant_fields
    @relevant_fields ||= @data['changes'].map do |change|
      IssueChange.new(
        fetch_from_change(change, 'num').to_i,
        fetch_from_change(change, 'title'),
        fetch_from_change(change, 'old_state'),
        fetch_from_change(change, 'new_state'),
        Time.parse(change['created_at'])
      )
    end
  end

  def count_states(changes)
    state_changes, day_state_counts = {}, {}

    changes.each do |k, v|
      state_changes[k] =
        v.map { |c| [c.old_state, c.new_state] }
         .flatten
         .group_by { |c| c }
    end

    state_changes.each do |k, v|
      day_state_counts[k] = {}
      state_changes[k].each do |k1, v1|
        day_state_counts[k].merge!({ k1 => v1.length })
      end
    end

    day_state_counts
  end

  def fetch_from_change(change, key)
    change['params']['issue'][key]
  end

  def group_changes_by_day
    relevant_fields.group_by { |r| r.time.strftime "%Y-%m-%d" }.sort.to_h
  end
end

stats_parser = StatsParser.new(ARGV[0])
puts stats_parser.process
